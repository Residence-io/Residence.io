import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RequestUser } from '../common/request-context';
import {
  AccountStatus,
  Prisma,
  ProfileCorrectionStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  canAssignRoles,
  redactAuditValue,
  removingLastSuperAdministrator,
} from './administration-policy';
import type {
  AssignRolesDto,
  CorrectionRequestDto,
  PageQueryDto,
  ResolveCorrectionDto,
  RolePermissionsDto,
  UserStatusDto,
} from './dto/administration.dto';

@Injectable()
export class AdministrationService {
  constructor(private readonly prisma: PrismaService) {}

  async users(actor: RequestUser, query: PageQueryDto) {
    const where: Prisma.UserAccountWhereInput = {
      societyId: actor.societyId,
      archivedAt: null,
      ...(query.status ? { status: query.status as AccountStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { username: { contains: query.search, mode: 'insensitive' } },
              { displayName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.userAccount.count({ where }),
      this.prisma.userAccount.findMany({
        where,
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          status: true,
          forcePasswordChange: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          version: true,
          roles: {
            select: {
              role: { select: { id: true, code: true, displayName: true } },
            },
          },
        },
        orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const activity = items.length
      ? await this.prisma.auditLog.findMany({
          where: {
            societyId: actor.societyId,
            targetType: 'UserAccount',
            targetId: { in: items.map((item) => item.id) },
          },
          select: {
            targetId: true,
            action: true,
            outcome: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: items.length * 3,
        })
      : [];
    return {
      items: items.map((item) => ({
        ...item,
        recentSecurityActivity: activity
          .filter((event) => event.targetId === item.id)
          .slice(0, 3),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  roles(actor: RequestUser) {
    return this.prisma.role.findMany({
      where: { societyId: actor.societyId },
      select: {
        id: true,
        code: true,
        displayName: true,
        description: true,
        systemRole: true,
        active: true,
        version: true,
        permissions: {
          select: {
            permission: { select: { id: true, code: true, description: true } },
          },
        },
        _count: { select: { users: true } },
      },
      orderBy: { displayName: 'asc' },
    });
  }

  permissions() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  async updateUserStatus(actor: RequestUser, id: string, dto: UserStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.userAccount.findFirst({
        where: { id, societyId: actor.societyId },
        include: { roles: { include: { role: true } } },
      });
      if (!target) throw new NotFoundException('User account not found.');
      if (target.version !== dto.version)
        throw new ConflictException(
          'The account changed. Reload and try again.',
        );
      await this.assertLastSuperSafe(
        tx,
        actor.societyId,
        target.roles.map((x) => x.role.code),
        dto.status === 'ACTIVE',
      );
      const result = await tx.userAccount.update({
        where: { id },
        data: {
          status: dto.status as AccountStatus,
          version: { increment: 1 },
        },
        select: { id: true, status: true, version: true },
      });
      if (dto.status !== 'ACTIVE')
        await tx.userSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: {
            revokedAt: new Date(),
            revokedReason: 'ADMINISTRATIVE_ACCOUNT_STATUS_CHANGE',
          },
        });
      await this.audit(
        tx,
        actor,
        'USER_ACCOUNT_STATUS_CHANGED',
        'UserAccount',
        id,
        dto.reason,
        { status: dto.status },
      );
      return result;
    });
  }

  async assignRoles(actor: RequestUser, id: string, dto: AssignRolesDto) {
    return this.prisma.$transaction(async (tx) => {
      const [target, roles] = await Promise.all([
        tx.userAccount.findFirst({
          where: { id, societyId: actor.societyId },
          include: { roles: { include: { role: true } } },
        }),
        tx.role.findMany({
          where: {
            id: { in: dto.roleIds },
            societyId: actor.societyId,
            active: true,
          },
          include: { permissions: { include: { permission: true } } },
        }),
      ]);
      if (!target) throw new NotFoundException('User account not found.');
      if (roles.length !== new Set(dto.roleIds).size)
        throw new NotFoundException('One or more roles were not found.');
      if (target.version !== dto.version)
        throw new ConflictException(
          'The account changed. Reload and try again.',
        );
      const desiredCodes = roles.map((role) => role.code);
      if (!canAssignRoles(actor.roles, desiredCodes))
        throw new ForbiddenException(
          'Only a super administrator can assign that role.',
        );
      if (
        !actor.roles.includes('SUPER_ADMINISTRATOR') &&
        roles.some((role) =>
          role.permissions.some(
            ({ permission }) => !actor.permissions.includes(permission.code),
          ),
        )
      )
        throw new ForbiddenException(
          'You cannot assign a role containing permissions you do not hold.',
        );
      await this.assertLastSuperSafe(
        tx,
        actor.societyId,
        target.roles.map((x) => x.role.code),
        target.status === 'ACTIVE' &&
          desiredCodes.includes('SUPER_ADMINISTRATOR'),
      );
      await tx.userRole.deleteMany({
        where: { societyId: actor.societyId, userId: id },
      });
      if (roles.length)
        await tx.userRole.createMany({
          data: roles.map((role) => ({
            societyId: actor.societyId,
            userId: id,
            roleId: role.id,
          })),
        });
      await tx.userAccount.update({
        where: { id },
        data: { version: { increment: 1 } },
      });
      await this.audit(
        tx,
        actor,
        'USER_ROLES_CHANGED',
        'UserAccount',
        id,
        dto.reason,
        { roleCodes: desiredCodes },
      );
      return { id, roles: desiredCodes };
    });
  }

  async updateRolePermissions(
    actor: RequestUser,
    roleId: string,
    dto: RolePermissionsDto,
  ) {
    if (!actor.roles.includes('SUPER_ADMINISTRATOR'))
      throw new ForbiddenException(
        'Only a super administrator can change role permissions.',
      );
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findFirst({
        where: { id: roleId, societyId: actor.societyId },
      });
      if (!role) throw new NotFoundException('Role not found.');
      if (role.version !== dto.version)
        throw new ConflictException('The role changed. Reload and try again.');
      const permissions = await tx.permission.findMany({
        where: { id: { in: dto.permissionIds } },
      });
      if (permissions.length !== new Set(dto.permissionIds).size)
        throw new NotFoundException('One or more permissions were not found.');
      if (
        role.code === 'SUPER_ADMINISTRATOR' &&
        !['ACCESS_ROLE_MANAGE', 'ACCESS_ADMIN_MANAGE'].every((code) =>
          permissions.some((permission) => permission.code === code),
        )
      )
        throw new ConflictException(
          'The super-administrator role must retain access administration permissions.',
        );
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissions.length)
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId,
            permissionId: permission.id,
          })),
        });
      await tx.role.update({
        where: { id: roleId },
        data: { version: { increment: 1 } },
      });
      await this.audit(
        tx,
        actor,
        'ROLE_PERMISSIONS_CHANGED',
        'Role',
        roleId,
        dto.reason,
        { permissionCodes: permissions.map((x) => x.code) },
      );
      return { roleId, permissions: permissions.map((x) => x.code) };
    });
  }

  async forcePasswordReset(actor: RequestUser, id: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.userAccount.findFirst({
        where: { id, societyId: actor.societyId },
      });
      if (!target) throw new NotFoundException('User account not found.');
      await tx.userAccount.update({
        where: { id },
        data: { forcePasswordChange: true, version: { increment: 1 } },
      });
      await tx.userSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: {
          revokedAt: new Date(),
          revokedReason: 'ADMIN_FORCED_PASSWORD_RESET',
        },
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await this.audit(
        tx,
        actor,
        'PASSWORD_RESET_FORCED',
        'UserAccount',
        id,
        reason,
        {},
      );
      return { forced: true, sessionsRevoked: true };
    });
  }

  async revokeSessions(actor: RequestUser, id: string, reason: string) {
    const target = await this.prisma.userAccount.findFirst({
      where: { id, societyId: actor.societyId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User account not found.');
    const result = await this.prisma.userSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'ADMIN_REVOKED_SESSIONS' },
    });
    await this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action: 'USER_SESSIONS_REVOKED',
        targetType: 'UserAccount',
        targetId: id,
        outcome: 'SUCCESS',
        reason,
        safeMetadata: { count: result.count },
      },
    });
    return { revoked: result.count };
  }

  async auditLogs(actor: RequestUser, query: PageQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      societyId: actor.societyId,
      ...(query.actorId ? { actorUserId: query.actorId } : {}),
      ...(query.action
        ? { action: { contains: query.action, mode: 'insensitive' } }
        : {}),
      ...(query.entity
        ? { targetType: { contains: query.entity, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: 'insensitive' } },
              { targetId: { contains: query.search, mode: 'insensitive' } },
              { reason: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, displayName: true, username: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: rows.map((row) => ({
        ...row,
        safeMetadata: redactAuditValue(row.safeMetadata),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  security(actor: RequestUser) {
    return this.prisma.userAccount.findUniqueOrThrow({
      where: { id: actor.id },
      select: {
        username: true,
        email: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        forcePasswordChange: true,
        _count: { select: { sessions: true } },
      },
    });
  }

  async createCorrection(actor: RequestUser, dto: CorrectionRequestDto) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId: actor.societyId, userId: actor.id },
      select: { id: true },
    });
    if (!resident) throw new NotFoundException('Resident profile not found.');
    const request = await this.prisma.profileCorrectionRequest.create({
      data: {
        societyId: actor.societyId,
        residentId: resident.id,
        requestedByUserId: actor.id,
        requestType: dto.requestType,
        requestedChanges: dto.requestedChanges as Prisma.InputJsonValue,
        reason: dto.reason,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action: 'PROFILE_CORRECTION_REQUESTED',
        targetType: 'ProfileCorrectionRequest',
        targetId: request.id,
        outcome: 'SUCCESS',
        safeMetadata: { requestType: dto.requestType },
      },
    });
    return request;
  }

  ownCorrections(actor: RequestUser) {
    return this.prisma.profileCorrectionRequest.findMany({
      where: { societyId: actor.societyId, requestedByUserId: actor.id },
      select: {
        id: true,
        requestType: true,
        reason: true,
        status: true,
        resolutionNote: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async corrections(actor: RequestUser, query: PageQueryDto) {
    const where: Prisma.ProfileCorrectionRequestWhereInput = {
      societyId: actor.societyId,
      ...(query.status
        ? { status: query.status as ProfileCorrectionStatus }
        : {}),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.profileCorrectionRequest.count({ where }),
      this.prisma.profileCorrectionRequest.findMany({
        where,
        include: {
          resident: { select: { residentNumber: true, fullName: true } },
          requestedBy: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async resolveCorrection(
    actor: RequestUser,
    id: string,
    dto: ResolveCorrectionDto,
  ) {
    const updated = await this.prisma.profileCorrectionRequest.updateMany({
      where: { id, societyId: actor.societyId, status: 'PENDING' },
      data: {
        status: dto.status as ProfileCorrectionStatus,
        resolutionNote: dto.reason,
        resolvedByUserId: actor.id,
        resolvedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (!updated.count)
      throw new NotFoundException('Pending correction request not found.');
    await this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action: 'PROFILE_CORRECTION_RESOLVED',
        targetType: 'ProfileCorrectionRequest',
        targetId: id,
        outcome: 'SUCCESS',
        reason: dto.reason,
        safeMetadata: { status: dto.status },
      },
    });
    return { id, status: dto.status };
  }

  private async assertLastSuperSafe(
    tx: Prisma.TransactionClient,
    societyId: string,
    currentRoles: string[],
    keepsSuperAndActive: boolean,
  ) {
    const targetHasSuper = currentRoles.includes('SUPER_ADMINISTRATOR');
    if (!targetHasSuper || keepsSuperAndActive) return;
    const count = await tx.userAccount.count({
      where: {
        societyId,
        status: 'ACTIVE',
        roles: {
          some: { role: { code: 'SUPER_ADMINISTRATOR', active: true } },
        },
      },
    });
    if (removingLastSuperAdministrator(count, true, false))
      throw new ConflictException(
        'The last active super administrator cannot be removed or suspended.',
      );
  }

  private audit(
    tx: Prisma.TransactionClient,
    actor: RequestUser,
    action: string,
    targetType: string,
    targetId: string,
    reason: string,
    safeMetadata: Prisma.InputJsonValue,
  ) {
    return tx.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action,
        targetType,
        targetId,
        outcome: 'SUCCESS',
        reason,
        safeMetadata,
      },
    });
  }
}
