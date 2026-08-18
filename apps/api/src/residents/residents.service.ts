import { randomBytes, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Gender,
  Prisma,
  PropertyType,
  type ResidentStatus,
} from '../generated/prisma/client';
import type { RequestUser } from '../common/request-context';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';
import {
  CreateResidentDto,
  HouseholdMemberDto,
  HouseholdMemberUpdateDto,
  LifecycleDto,
  MoveOutDto,
  ProvisionAccountDto,
  ResidentQueryDto,
  UpdateRelatedDto,
  UpdateResidentDto,
  VehicleDto,
} from './dto/resident.dto';
import { IdentityProtectionService } from './identity-protection.service';
import { ResidentIdService } from './resident-id.service';

const residentInclude = {
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      forcePasswordChange: true,
    },
  },
  occupancies: {
    include: { unit: { include: { property: true } } },
    orderBy: { startDate: 'desc' as const },
  },
  householdMembers: { orderBy: { createdAt: 'asc' as const } },
  vehicles: { orderBy: { createdAt: 'asc' as const } },
  documents: {
    select: {
      id: true,
      category: true,
      status: true,
      originalFileName: true,
      mediaType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
  idCards: {
    select: {
      id: true,
      cardNumber: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
    },
    orderBy: { issuedAt: 'desc' as const },
  },
  feeAssignments: { orderBy: { effectiveFrom: 'desc' as const }, take: 1 },
} satisfies Prisma.ResidentInclude;

@Injectable()
export class ResidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly identity: IdentityProtectionService,
    private readonly ids: ResidentIdService,
    private readonly storage: PrivateStorageService,
  ) {}

  async create(
    actor: RequestUser,
    dto: CreateResidentDto,
    tenancyAgreement?: Express.Multer.File,
  ) {
    this.requirePermission(actor, 'RESIDENT_CREATE');
    this.validateTenancy(dto);
    if (dto.occupancyType === 'TENANT' && !tenancyAgreement)
      throw new BadRequestException(
        'A tenancy agreement document is required for tenants.',
      );
    let storedTenancy:
      | Awaited<ReturnType<PrivateStorageService['store']>>
      | undefined;
    const temporaryPassword = dto.account?.createAccount
      ? (dto.account.temporaryPassword ?? this.generateTemporaryPassword())
      : undefined;
    const passwordHash = temporaryPassword
      ? await this.passwords.hash(temporaryPassword)
      : undefined;
    const identity = dto.identityDocumentNumber
      ? this.identity.protect(dto.identityDocumentNumber)
      : undefined;
    try {
      storedTenancy = tenancyAgreement
        ? await this.storage.store(
            actor.id,
            tenancyAgreement.buffer,
            tenancyAgreement.originalname,
            tenancyAgreement.mimetype,
          )
        : undefined;
      const result = await this.prisma.$transaction(
        async (tx) => {
          const unit = await tx.unit.findFirst({
            where: {
              id: dto.unitId,
              property: { societyId: actor.societyId, active: true },
              archivedAt: null,
            },
            include: { property: true },
          });
          if (!unit)
            throw new NotFoundException('The selected unit was not found.');
          const occupied = await tx.residentOccupancy.findFirst({
            where: { unitId: unit.id, endDate: null, primaryResident: true },
            select: { id: true },
          });
          if (occupied)
            throw new ConflictException(
              'The selected unit already has an active primary resident.',
            );

          let userId: string | undefined;
          if (dto.account?.createAccount) {
            const residentRole = await tx.role.findUnique({
              where: {
                uk_role_society_code: {
                  societyId: actor.societyId,
                  code: 'RESIDENT',
                },
              },
            });
            if (!residentRole)
              throw new BadRequestException(
                'The Resident role is not configured.',
              );
            const username = dto.account.username!.trim();
            const email = (dto.account.email ?? dto.email)?.trim();
            const account = await tx.userAccount.create({
              data: {
                societyId: actor.societyId,
                username,
                normalizedUsername: username.toUpperCase(),
                email,
                normalizedEmail: email?.toUpperCase(),
                displayName: dto.fullName.trim(),
                passwordHash: passwordHash!,
                status: dto.account.active ? 'ACTIVE' : 'DEACTIVATED',
                forcePasswordChange: true,
                roles: {
                  create: {
                    societyId: actor.societyId,
                    roleId: residentRole.id,
                  },
                },
              },
            });
            userId = account.id;
          }

          const residentNumber = await this.ids.next(tx, actor.societyId);
          const resident = await tx.resident.create({
            data: {
              societyId: actor.societyId,
              userId,
              residentNumber,
              fullName: dto.fullName.trim(),
              normalizedFullName: dto.fullName.trim().toUpperCase(),
              guardianName: dto.guardianName?.trim(),
              dateOfBirth: dto.dateOfBirth
                ? new Date(dto.dateOfBirth)
                : undefined,
              gender: dto.gender as Gender,
              email: dto.email?.trim(),
              primaryPhone: dto.primaryPhone.trim(),
              alternatePhone: dto.alternatePhone?.trim(),
              identityCiphertext: identity?.ciphertext,
              identitySearchHash: identity?.searchHash,
              identityLastFour: identity?.lastFour,
              permanentAddress: dto.permanentAddress?.trim(),
              emergencyContactName: dto.emergencyContactName?.trim(),
              emergencyContactPhone: dto.emergencyContactPhone?.trim(),
              householdSize: dto.householdSize,
              occupancies: {
                create: {
                  unitId: unit.id,
                  occupancyType: dto.occupancyType,
                  startDate: new Date(dto.moveInDate),
                  propertyOwnerName: dto.propertyOwnerName?.trim(),
                  propertyOwnerPhone: dto.propertyOwnerPhone?.trim(),
                  propertyOwnerEmail: dto.propertyOwnerEmail?.trim(),
                  tenancyStartDate: dto.tenancyStartDate
                    ? new Date(dto.tenancyStartDate)
                    : undefined,
                  tenancyEndDate: dto.tenancyEndDate
                    ? new Date(dto.tenancyEndDate)
                    : undefined,
                },
              },
              feeAssignments: {
                create: {
                  monthlyAmount: new Prisma.Decimal(dto.monthlyFee),
                  securityDeposit: dto.securityDeposit
                    ? new Prisma.Decimal(dto.securityDeposit)
                    : undefined,
                  currency: (
                    await tx.society.findUniqueOrThrow({
                      where: { id: actor.societyId },
                      select: { currency: true },
                    })
                  ).currency,
                  effectiveFrom: new Date(dto.moveInDate),
                },
              },
              householdMembers: {
                create: dto.householdMembers.map((member) => ({
                  fullName: member.fullName.trim(),
                  relationship: member.relationship.trim(),
                  dateOfBirth: member.dateOfBirth
                    ? new Date(member.dateOfBirth)
                    : undefined,
                  gender: member.gender as Gender,
                  phone: member.phone?.trim(),
                  identityLastFour: member.identityDocumentNumber
                    ?.replace(/[^A-Za-z0-9]/g, '')
                    .slice(-4),
                  emergencyContact: member.emergencyContact,
                })),
              },
              vehicles: {
                create: dto.vehicles.map((vehicle) => ({
                  societyId: actor.societyId,
                  ...this.vehicleData(vehicle),
                })),
              },
              documents: storedTenancy
                ? {
                    create: {
                      category: 'TENANCY_AGREEMENT',
                      uploadedByUserId: actor.id,
                      ...storedTenancy,
                      sizeBytes: BigInt(storedTenancy.sizeBytes),
                    },
                  }
                : undefined,
            },
            include: residentInclude,
          });
          await tx.unit.update({
            where: { id: unit.id },
            data: { status: 'OCCUPIED', version: { increment: 1 } },
          });
          await tx.auditLog.createMany({
            data: [
              {
                societyId: actor.societyId,
                actorUserId: actor.id,
                action: 'RESIDENT_CREATED',
                targetType: 'Resident',
                targetId: resident.id,
                outcome: 'SUCCESS',
                safeMetadata: {
                  residentNumber,
                  occupancyType: dto.occupancyType,
                },
              },
              {
                societyId: actor.societyId,
                actorUserId: actor.id,
                action: 'RESIDENT_MOVED_IN',
                targetType: 'Resident',
                targetId: resident.id,
                outcome: 'SUCCESS',
                safeMetadata: { unitId: unit.id },
              },
              ...(userId
                ? [
                    {
                      societyId: actor.societyId,
                      actorUserId: actor.id,
                      action: 'RESIDENT_ACCOUNT_PROVISIONED',
                      targetType: 'UserAccount',
                      targetId: userId,
                      outcome: 'SUCCESS' as const,
                      safeMetadata: { residentId: resident.id },
                    },
                  ]
                : []),
              ...(storedTenancy
                ? [
                    {
                      societyId: actor.societyId,
                      actorUserId: actor.id,
                      action: 'RESIDENT_DOCUMENT_UPLOADED',
                      targetType: 'Resident',
                      targetId: resident.id,
                      outcome: 'SUCCESS' as const,
                      safeMetadata: {
                        category: 'TENANCY_AGREEMENT',
                        sizeBytes: storedTenancy.sizeBytes,
                      },
                    },
                  ]
                : []),
            ],
          });
          if (userId) {
            await tx.outboxEvent.create({
              data: {
                aggregateType: 'UserAccount',
                aggregateId: userId,
                eventType: 'RESIDENT_ACCOUNT_INVITATION_REQUESTED',
                deduplicationKey: randomUUID(),
                payload: { userId, residentId: resident.id },
              },
            });
          }
          return resident;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return {
        resident: this.serialize(result),
        ...(temporaryPassword ? { temporaryPassword } : {}),
      };
    } catch (error) {
      if (storedTenancy) await this.storage.remove(storedTenancy.objectKey);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'A username, email, resident ID, vehicle registration, or occupancy is already in use.',
        );
      throw error;
    }
  }

  async list(actor: RequestUser, query: ResidentQueryDto) {
    this.requirePermission(actor, 'RESIDENT_READ');
    if (
      query.identityNumber &&
      !actor.roles.includes('SUPER_ADMINISTRATOR') &&
      !actor.permissions.includes('RESIDENT_DOCUMENT_READ')
    )
      throw new ForbiddenException(
        'Protected identity search is not permitted.',
      );
    const search = query.search?.trim();
    const activeOccupancy: Prisma.ResidentOccupancyWhereInput = {
      ...(query.occupancyType ? { occupancyType: query.occupancyType } : {}),
      ...(query.block || query.propertyType
        ? {
            unit: {
              property: {
                ...(query.block
                  ? { block: { equals: query.block, mode: 'insensitive' } }
                  : {}),
                ...(query.propertyType
                  ? { type: query.propertyType as PropertyType }
                  : {}),
              },
            },
          }
        : {}),
      ...(query.moveInFrom || query.moveInTo
        ? {
            startDate: {
              ...(query.moveInFrom ? { gte: new Date(query.moveInFrom) } : {}),
              ...(query.moveInTo ? { lte: new Date(query.moveInTo) } : {}),
            },
          }
        : {}),
    };
    const statusFilter: Prisma.ResidentWhereInput =
      !query.status || query.status === 'ALL'
        ? {}
        : query.status === 'PREVIOUS'
          ? { status: { in: ['MOVED_OUT', 'ARCHIVED'] } }
          : query.status === 'INACTIVE'
            ? {
                OR: [
                  { status: { in: ['INACTIVE', 'SUSPENDED'] } },
                  { user: { is: { status: { not: 'ACTIVE' } } } },
                ],
              }
            : { status: query.status as ResidentStatus };
    const where: Prisma.ResidentWhereInput = {
      societyId: actor.societyId,
      ...statusFilter,
      ...(query.identityNumber
        ? { identitySearchHash: this.identity.searchHash(query.identityNumber) }
        : {}),
      ...(search
        ? {
            OR: [
              { residentNumber: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
              { primaryPhone: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
              { user: { username: { contains: search, mode: 'insensitive' } } },
              {
                occupancies: {
                  some: {
                    endDate: null,
                    unit: {
                      OR: [
                        {
                          unitNumber: { contains: search, mode: 'insensitive' },
                        },
                        {
                          property: {
                            block: { contains: search, mode: 'insensitive' },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(Object.keys(activeOccupancy).length
        ? { occupancies: { some: activeOccupancy } }
        : {}),
    };
    const orderBy: Prisma.ResidentOrderByWithRelationInput =
      query.sort === 'fullName'
        ? { fullName: query.direction }
        : query.sort === 'createdAt'
          ? { createdAt: query.direction }
          : { residentNumber: query.direction };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.resident.count({ where }),
      this.prisma.resident.findMany({
        where,
        include: residentInclude,
        orderBy: [orderBy, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: rows.map((row) => this.serialize(row)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async detail(actor: RequestUser, id: string) {
    const resident = await this.findScoped(actor, id);
    return this.serialize(
      resident,
      actor.permissions.includes('AUDIT_READ')
        ? await this.prisma.auditLog.findMany({
            where: { societyId: actor.societyId, targetId: id },
            select: {
              id: true,
              action: true,
              outcome: true,
              reason: true,
              safeMetadata: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          })
        : undefined,
    );
  }

  async ownProfile(actor: RequestUser) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId: actor.societyId, userId: actor.id },
      include: residentInclude,
    });
    if (!resident)
      throw new NotFoundException(
        'A resident profile is not linked to this account.',
      );
    return this.serialize(resident);
  }

  async update(
    actor: RequestUser,
    id: string,
    dto: UpdateResidentDto,
    own = false,
  ) {
    const current = await this.findScoped(actor, id, own);
    if (!own) this.requirePermission(actor, 'RESIDENT_UPDATE');
    const data: Prisma.ResidentUpdateManyMutationInput = {
      ...(dto.fullName
        ? {
            fullName: dto.fullName.trim(),
            normalizedFullName: dto.fullName.trim().toUpperCase(),
          }
        : {}),
      guardianName: dto.guardianName?.trim(),
      email: dto.email?.trim(),
      primaryPhone: dto.primaryPhone?.trim(),
      alternatePhone: dto.alternatePhone?.trim(),
      permanentAddress: dto.permanentAddress?.trim(),
      emergencyContactName: dto.emergencyContactName?.trim(),
      emergencyContactPhone: dto.emergencyContactPhone?.trim(),
      version: { increment: 1 },
    };
    const changed = await this.prisma.resident.updateMany({
      where: {
        id: current.id,
        societyId: actor.societyId,
        version: dto.version,
      },
      data,
    });
    if (changed.count !== 1)
      throw new ConflictException(
        'This resident was changed by another user. Reload and try again.',
      );
    await this.audit(actor, 'RESIDENT_UPDATED', id, {
      fields: Object.keys(dto).filter((key) => key !== 'version'),
    });
    return this.detail(actor, id);
  }

  async suspend(actor: RequestUser, id: string, dto: LifecycleDto) {
    return this.changeStatus(
      actor,
      id,
      'SUSPENDED',
      dto.reason,
      'RESIDENT_SUSPENDED',
    );
  }
  async activate(actor: RequestUser, id: string, dto: LifecycleDto) {
    return this.changeStatus(
      actor,
      id,
      'ACTIVE',
      dto.reason,
      'RESIDENT_ACTIVATED',
    );
  }

  async moveOut(actor: RequestUser, id: string, dto: MoveOutDto) {
    this.requirePermission(actor, 'RESIDENT_STATUS_CHANGE');
    await this.findScoped(actor, id);
    await this.prisma.$transaction(async (tx) => {
      const occupancy = await tx.residentOccupancy.findFirst({
        where: { residentId: id, endDate: null },
      });
      if (!occupancy)
        throw new ConflictException('The resident has no active occupancy.');
      const endDate = new Date(dto.moveOutDate);
      if (endDate < occupancy.startDate)
        throw new BadRequestException(
          'Move-out date cannot be before move-in date.',
        );
      await tx.residentOccupancy.update({
        where: { id: occupancy.id },
        data: { endDate, moveOutReason: dto.reason, version: { increment: 1 } },
      });
      await tx.resident.update({
        where: { id },
        data: { status: 'MOVED_OUT', version: { increment: 1 } },
      });
      await tx.unit.update({
        where: { id: occupancy.unitId },
        data: { status: 'AVAILABLE', version: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: 'RESIDENT_MOVED_OUT',
          targetType: 'Resident',
          targetId: id,
          outcome: 'SUCCESS',
          reason: dto.reason,
          safeMetadata: { moveOutDate: dto.moveOutDate },
        },
      });
    });
    return this.detail(actor, id);
  }

  async archive(actor: RequestUser, id: string, dto: LifecycleDto) {
    this.requirePermission(actor, 'RESIDENT_ARCHIVE');
    await this.findScoped(actor, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.resident.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.userAccount.updateMany({
        where: { resident: { id }, status: { not: 'ARCHIVED' } },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: 'RESIDENT_ARCHIVED',
          targetType: 'Resident',
          targetId: id,
          outcome: 'SUCCESS',
          reason: dto.reason,
        },
      });
    });
    return this.detail(actor, id);
  }

  async ownHouseholdMembers(actor: RequestUser) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId: actor.societyId, userId: actor.id },
      select: { id: true },
    });
    if (!resident)
      throw new NotFoundException(
        'A resident profile is not linked to this account.',
      );
    return this.prisma.householdMember.findMany({
      where: { residentId: resident.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addOwnHouseholdMember(actor: RequestUser, dto: HouseholdMemberDto) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId: actor.societyId, userId: actor.id },
      select: { id: true },
    });
    if (!resident)
      throw new NotFoundException(
        'A resident profile is not linked to this account.',
      );
    return this.createHouseholdMember(actor, resident.id, dto);
  }

  async updateOwnHouseholdMember(
    actor: RequestUser,
    memberId: string,
    dto: HouseholdMemberUpdateDto,
  ) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId: actor.societyId, userId: actor.id },
      select: { id: true },
    });
    if (!resident)
      throw new NotFoundException(
        'A resident profile is not linked to this account.',
      );
    const changed = await this.prisma.householdMember.updateMany({
      where: {
        id: memberId,
        residentId: resident.id,
        status: 'ACTIVE',
        version: dto.version,
      },
      data: {
        fullName: dto.fullName?.trim(),
        relationship: dto.relationship?.trim(),
        age: dto.age,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender as Gender | undefined,
        phone: dto.phone?.trim(),
        emergencyContact: dto.emergencyContact,
        version: { increment: 1 },
      },
    });
    if (changed.count !== 1)
      throw new ConflictException(
        'The family member changed or was not found. Reload and try again.',
      );
    await this.audit(actor, 'HOUSEHOLD_MEMBER_CHANGED', resident.id, {
      householdMemberId: memberId,
      ownerManaged: true,
    });
    return this.prisma.householdMember.findUniqueOrThrow({
      where: { id: memberId },
    });
  }

  async removeOwnHouseholdMember(
    actor: RequestUser,
    memberId: string,
    version: number,
  ) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId: actor.societyId, userId: actor.id },
      select: { id: true },
    });
    if (!resident)
      throw new NotFoundException(
        'A resident profile is not linked to this account.',
      );
    const changed = await this.prisma.householdMember.updateMany({
      where: {
        id: memberId,
        residentId: resident.id,
        status: 'ACTIVE',
        version,
      },
      data: { status: 'INACTIVE', version: { increment: 1 } },
    });
    if (changed.count !== 1)
      throw new ConflictException(
        'The family member changed or was not found. Reload and try again.',
      );
    await this.audit(actor, 'HOUSEHOLD_MEMBER_REMOVED', resident.id, {
      householdMemberId: memberId,
      ownerManaged: true,
    });
    return { removed: true };
  }

  async addHouseholdMember(
    actor: RequestUser,
    residentId: string,
    dto: HouseholdMemberDto,
  ) {
    this.requirePermission(actor, 'RESIDENT_UPDATE');
    await this.findScoped(actor, residentId);
    return this.createHouseholdMember(actor, residentId, dto);
  }

  private async createHouseholdMember(
    actor: RequestUser,
    residentId: string,
    dto: HouseholdMemberDto,
  ) {
    const member = await this.prisma.householdMember.create({
      data: {
        residentId,
        fullName: dto.fullName.trim(),
        relationship: dto.relationship.trim(),
        age: dto.age,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender as Gender,
        phone: dto.phone?.trim(),
        identityLastFour: dto.identityDocumentNumber
          ?.replace(/[^A-Za-z0-9]/g, '')
          .slice(-4),
        emergencyContact: dto.emergencyContact,
      },
    });
    await this.audit(actor, 'HOUSEHOLD_MEMBER_ADDED', residentId, {
      householdMemberId: member.id,
    });
    return member;
  }

  async updateHouseholdMember(
    actor: RequestUser,
    residentId: string,
    memberId: string,
    dto: UpdateRelatedDto,
  ) {
    this.requirePermission(actor, 'RESIDENT_UPDATE');
    await this.findScoped(actor, residentId);
    const result = await this.prisma.householdMember.updateMany({
      where: { id: memberId, residentId, version: dto.version },
      data: {
        status:
          dto.active === false
            ? 'INACTIVE'
            : dto.movedOutAt
              ? 'MOVED_OUT'
              : undefined,
        movedOutAt: dto.movedOutAt ? new Date(dto.movedOutAt) : undefined,
        version: { increment: 1 },
      },
    });
    if (!result.count)
      throw new ConflictException(
        'The household member changed or was not found.',
      );
    await this.audit(actor, 'HOUSEHOLD_MEMBER_CHANGED', residentId, {
      householdMemberId: memberId,
    });
  }

  async addVehicle(actor: RequestUser, residentId: string, dto: VehicleDto) {
    this.requirePermission(actor, 'RESIDENT_UPDATE');
    const resident = await this.findScoped(actor, residentId);
    try {
      const vehicle = await this.prisma.vehicle.create({
        data: {
          societyId: resident.societyId,
          residentId,
          ...this.vehicleData(dto),
        } as any,
      });
      await this.audit(actor, 'VEHICLE_ADDED', residentId, {
        vehicleId: vehicle.id,
      });
      return vehicle;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'That vehicle registration is already active.',
        );
      throw error;
    }
  }

  async updateVehicle(
    actor: RequestUser,
    residentId: string,
    vehicleId: string,
    dto: UpdateRelatedDto,
  ) {
    this.requirePermission(actor, 'RESIDENT_UPDATE');
    await this.findScoped(actor, residentId);
    const result = await this.prisma.vehicle.updateMany({
      where: { id: vehicleId, residentId, version: dto.version },
      data: {
        active: dto.active,
        deactivatedAt: dto.active === false ? new Date() : null,
        version: { increment: 1 },
      },
    });
    if (!result.count)
      throw new ConflictException('The vehicle changed or was not found.');
    await this.audit(actor, 'VEHICLE_CHANGED', residentId, { vehicleId });
  }

  async assertDocumentAccess(
    actor: RequestUser,
    residentId: string,
    manage = false,
  ) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId: actor.societyId },
      select: { id: true, userId: true },
    });
    if (!resident) throw new NotFoundException('Resident not found.');
    const permission = manage
      ? 'RESIDENT_DOCUMENT_MANAGE'
      : 'RESIDENT_DOCUMENT_READ';
    if (resident.userId !== actor.id && !actor.permissions.includes(permission))
      throw new ForbiddenException('You cannot access this resident document.');
    return resident;
  }

  private async changeStatus(
    actor: RequestUser,
    id: string,
    status: ResidentStatus,
    reason: string,
    event: string,
  ) {
    this.requirePermission(actor, 'RESIDENT_STATUS_CHANGE');
    const resident = await this.findScoped(actor, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.resident.update({
        where: { id },
        data: {
          status,
          suspensionReason: status === 'SUSPENDED' ? reason : null,
          version: { increment: 1 },
        },
      });
      if (resident.userId)
        await tx.userAccount.update({
          where: { id: resident.userId },
          data: {
            status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
            version: { increment: 1 },
          },
        });
      await tx.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: event,
          targetType: 'Resident',
          targetId: id,
          outcome: 'SUCCESS',
          reason,
        },
      });
    });
    return this.detail(actor, id);
  }

  private async findScoped(actor: RequestUser, id: string, own = false) {
    const resident = await this.prisma.resident.findFirst({
      where: { id, societyId: actor.societyId },
      include: residentInclude,
    });
    if (!resident) throw new NotFoundException('Resident not found.');
    if (own && resident.userId !== actor.id)
      throw new ForbiddenException(
        'You can access only your own resident profile.',
      );
    if (
      !own &&
      resident.userId !== actor.id &&
      !actor.permissions.includes('RESIDENT_READ')
    )
      throw new ForbiddenException('Resident access is not permitted.');
    return resident;
  }

  private requirePermission(actor: RequestUser, permission: string) {
    if (!actor.permissions.includes(permission))
      throw new ForbiddenException(
        'You do not have the required resident-management permission.',
      );
  }

  private validateTenancy(dto: CreateResidentDto) {
    if (dto.occupancyType !== 'TENANT') return;
    if (
      !dto.propertyOwnerName ||
      !dto.propertyOwnerPhone ||
      !dto.tenancyStartDate ||
      !dto.tenancyEndDate
    )
      throw new BadRequestException(
        'Owner contact and tenancy dates are required for tenants.',
      );
    if (new Date(dto.tenancyEndDate) < new Date(dto.tenancyStartDate))
      throw new BadRequestException(
        'Tenancy end date cannot be before its start date.',
      );
    if (
      new Date(dto.moveInDate) < new Date(dto.tenancyStartDate) ||
      new Date(dto.moveInDate) > new Date(dto.tenancyEndDate)
    )
      throw new BadRequestException(
        'Move-in date must fall within the tenancy dates.',
      );
  }

  async provisionAccount(
    actor: RequestUser,
    residentId: string,
    dto: ProvisionAccountDto,
  ) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId: actor.societyId, archivedAt: null },
      select: { id: true, userId: true, fullName: true, email: true },
    });
    if (!resident) throw new NotFoundException('Resident not found.');
    if (resident.userId)
      throw new ConflictException('This resident already has a login account.');
    const temporaryPassword =
      dto.temporaryPassword ?? this.generateTemporaryPassword();
    const passwordHash = await this.passwords.hash(temporaryPassword);
    await this.prisma.$transaction(async (tx) => {
      const residentRole = await tx.role.findUnique({
        where: {
          uk_role_society_code: {
            societyId: actor.societyId,
            code: 'RESIDENT',
          },
        },
      });
      if (!residentRole)
        throw new BadRequestException('The Resident role is not configured.');
      const username = dto.username.trim();
      const email = (dto.email ?? resident.email)?.trim();
      const account = await tx.userAccount.create({
        data: {
          societyId: actor.societyId,
          username,
          normalizedUsername: username.toUpperCase(),
          email,
          normalizedEmail: email?.toUpperCase(),
          displayName: resident.fullName,
          passwordHash,
          status: dto.active ? 'ACTIVE' : 'DEACTIVATED',
          forcePasswordChange: true,
          roles: {
            create: { societyId: actor.societyId, roleId: residentRole.id },
          },
        },
      });
      await tx.resident.update({
        where: { id: residentId },
        data: { userId: account.id },
      });
    });
    await this.audit(actor, 'RESIDENT_ACCOUNT_PROVISIONED', residentId, {
      username: dto.username.trim(),
    });
    return { temporaryPassword };
  }

  async revokeResidentSessions(actor: RequestUser, residentId: string) {
    const userId = await this.getResidentUserId(actor, residentId);
    const result = await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'ADMIN_REVOKED_SESSIONS' },
    });
    await this.audit(actor, 'RESIDENT_SESSIONS_REVOKED', residentId, {
      count: result.count,
    });
    return { revoked: result.count };
  }

  async forceResidentPasswordReset(actor: RequestUser, residentId: string) {
    const userId = await this.getResidentUserId(actor, residentId);
    await this.prisma.$transaction(async (tx) => {
      await tx.userAccount.update({
        where: { id: userId },
        data: { forcePasswordChange: true, version: { increment: 1 } },
      });
      await tx.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: {
          revokedAt: new Date(),
          revokedReason: 'ADMIN_FORCED_PASSWORD_RESET',
        },
      });
    });
    await this.audit(actor, 'RESIDENT_PASSWORD_RESET_FORCED', residentId, {});
    return { forced: true };
  }

  async updateResidentAccountStatus(
    actor: RequestUser,
    residentId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    reason: string,
  ) {
    const userId = await this.getResidentUserId(actor, residentId);
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: { status, version: { increment: 1 } },
    });
    await this.audit(actor, 'RESIDENT_ACCOUNT_STATUS_CHANGED', residentId, {
      status,
      reason,
    });
    return { status };
  }

  async regenerateResidentTemporaryPassword(
    actor: RequestUser,
    residentId: string,
    requestedPassword: string,
    reason: string,
  ) {
    const userId = await this.getResidentUserId(actor, residentId);
    const temporaryPassword = requestedPassword;
    const passwordHash = await this.passwords.hash(temporaryPassword);
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        passwordHash,
        forcePasswordChange: true,
        authMigrationState: 'RESET_REQUIRED',
        version: { increment: 1 },
      },
    });
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedReason: 'ADMIN_RESET_TEMP_PASSWORD',
      },
    });
    await this.audit(
      actor,
      'RESIDENT_TEMPORARY_PASSWORD_REGENERATED',
      residentId,
      { reason },
    );
    return { temporaryPassword };
  }

  private async getResidentUserId(
    actor: RequestUser,
    residentId: string,
  ): Promise<string> {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId: actor.societyId },
      select: { userId: true },
    });
    if (!resident) throw new NotFoundException('Resident not found.');
    if (!resident.userId)
      throw new BadRequestException(
        'This resident does not have a login account.',
      );
    return resident.userId;
  }

  private generateTemporaryPassword(): string {
    return `${randomBytes(15).toString('base64url')}!7a`;
  }
  private vehicleData(dto: VehicleDto) {
    return {
      type: dto.type.trim(),
      name: dto.name?.trim(),
      manufacturer: dto.manufacturer?.trim(),
      model: dto.model?.trim(),
      colour: dto.colour?.trim(),
      registrationNumber: dto.registrationNumber.trim().toUpperCase(),
      normalizedRegistrationNumber: dto.registrationNumber
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase(),
      parkingPermitNumber: dto.parkingPermitNumber?.trim(),
      parkingLocation: dto.parkingLocation?.trim(),
    };
  }
  private async audit(
    actor: RequestUser,
    action: string,
    targetId: string,
    safeMetadata: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action,
        targetType: 'Resident',
        targetId,
        outcome: 'SUCCESS',
        safeMetadata,
      },
    });
  }
  private serialize<
    T extends {
      identityCiphertext?: string | null;
      identitySearchHash?: string | null;
      identityLastFour?: string | null;
      documents?: Array<{ sizeBytes: bigint; [key: string]: unknown }>;
      feeAssignments?: Array<{
        monthlyAmount: Prisma.Decimal;
        securityDeposit: Prisma.Decimal | null;
        [key: string]: unknown;
      }>;
    },
  >(resident: T, auditHistory?: unknown) {
    const identityLastFour = resident.identityLastFour;
    const safe = { ...resident };
    delete safe.identityCiphertext;
    delete safe.identitySearchHash;
    delete safe.identityLastFour;
    const profilePhotograph = resident.documents?.find(
      (document) =>
        (document as { category?: string }).category === 'PROFILE_PHOTOGRAPH' &&
        (document as { status?: string }).status === 'ACTIVE',
    );
    return {
      ...safe,
      maskedIdentityNumber: identityLastFour ? `••••${identityLastFour}` : null,
      profilePhotograph: profilePhotograph
        ? {
            ...profilePhotograph,
            sizeBytes: Number(profilePhotograph.sizeBytes),
          }
        : null,
      documents: resident.documents?.map((document) => ({
        ...document,
        sizeBytes: Number(document.sizeBytes),
      })),
      feeAssignments: resident.feeAssignments?.map((fee) => ({
        ...fee,
        monthlyAmount: fee.monthlyAmount.toString(),
        securityDeposit: fee.securityDeposit?.toString() ?? null,
      })),
      ...(auditHistory ? { auditHistory } : {}),
    };
  }
}
