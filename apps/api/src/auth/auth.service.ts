import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LoginDto } from './dto/login.dto';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { PasswordService } from './password.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import type { RequestUser } from '../common/request-context';

interface RequestMetadata {
  correlationId?: string;
  sourceIp?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async login(dto: LoginDto, metadata: RequestMetadata) {
    const identifier = dto.identifier.trim().toUpperCase();
    const user = await this.prisma.userAccount.findFirst({
      where: {
        OR: [
          { normalizedUsername: identifier },
          { normalizedEmail: identifier },
        ],
      },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!user) {
      await this.audit.recordSafely({
        action: 'LOGIN_FAILURE',
        outcome: 'FAILURE',
        reason: 'INVALID_CREDENTIALS',
        correlationId: metadata.correlationId,
        sourceIp: metadata.sourceIp,
      });
      throw this.invalidCredentials();
    }
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      await this.audit.recordSafely({
        societyId: user.societyId,
        actorUserId: user.id,
        action: 'LOGIN_FAILURE',
        targetType: 'UserAccount',
        targetId: user.id,
        outcome: 'FAILURE',
        reason: 'ACCOUNT_LOCKED',
        correlationId: metadata.correlationId,
        sourceIp: metadata.sourceIp,
      });
      throw this.invalidCredentials();
    }
    if (
      user.status !== 'ACTIVE' ||
      !(await this.passwords.verify(user.passwordHash, dto.password))
    ) {
      const failures = user.failedLoginCount + 1;
      const maxAttempts = this.config.getOrThrow<number>(
        'authentication.maxAttempts',
      );
      const lockedUntil =
        failures >= maxAttempts
          ? new Date(
              now.getTime() +
                this.config.getOrThrow<number>('authentication.lockMinutes') *
                  60_000,
            )
          : null;
      await this.prisma.userAccount.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failures >= maxAttempts ? 0 : failures,
          lockedUntil,
        },
      });
      await this.audit.recordSafely({
        societyId: user.societyId,
        actorUserId: user.id,
        action: lockedUntil ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILURE',
        targetType: 'UserAccount',
        targetId: user.id,
        outcome: 'FAILURE',
        reason:
          user.status === 'ACTIVE' ? 'INVALID_CREDENTIALS' : 'ACCOUNT_INACTIVE',
        correlationId: metadata.correlationId,
        sourceIp: metadata.sourceIp,
      });
      throw this.invalidCredentials();
    }
    const rawSessionToken = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      now.getTime() +
        this.config.getOrThrow<number>('session.ttlMinutes') * 60_000,
    );
    const session = await this.prisma.$transaction(async (transaction) => {
      await transaction.userAccount.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now },
      });
      return transaction.userSession.create({
        data: {
          societyId: user.societyId,
          userId: user.id,
          tokenHash: this.digest(rawSessionToken),
          csrfTokenHash: this.digest(csrfToken),
          expiresAt,
          sourceIp: metadata.sourceIp,
          userAgent: metadata.userAgent,
        },
      });
    });
    const roles = user.roles
      .filter((entry) => entry.role.active)
      .map((entry) => entry.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((entry) =>
          entry.role.permissions.map((grant) => grant.permission.code),
        ),
      ),
    ];
    await this.audit.recordSafely({
      societyId: user.societyId,
      actorUserId: user.id,
      action: 'LOGIN_SUCCESS',
      targetType: 'UserAccount',
      targetId: user.id,
      outcome: 'SUCCESS',
      correlationId: metadata.correlationId,
      sourceIp: metadata.sourceIp,
    });

    // Phase S2: If Supabase Auth is enabled, provision/fetch a Supabase session
    let supabaseSession: {
      access_token: string;
      refresh_token: string;
    } | null = null;
    if (this.supabaseAdmin.isEnabled) {
      supabaseSession = await this.provisionSupabaseSession(user);
    }

    return {
      rawSessionToken,
      csrfToken,
      expiresAt,
      user: {
        id: user.id,
        societyId: user.societyId,
        username: user.username,
        displayName: user.displayName,
        forcePasswordChange: user.forcePasswordChange,
        roles,
        permissions,
        csrfToken,
      },
      sessionId: session.id,
      // Included when FEATURE_SUPABASE_AUTH=true so frontend can call setSession()
      supabaseSession,
    };
  }

  /**
   * Phase S2 — Creates or retrieves a Supabase Auth session for the given user.
   * On first login: creates a Supabase user linked to this account.
   * On subsequent logins: generates an admin session directly.
   */
  private async provisionSupabaseSession(
    user: Awaited<ReturnType<PrismaService['userAccount']['findFirst']>>,
  ): Promise<{ access_token: string; refresh_token: string } | null> {
    if (!user) return null;

    try {
      let authUserId = (user as any).authUserId as string | null;

      // First time: create Supabase user
      if (!authUserId) {
        const email =
          user.email ?? `${user.username.toLowerCase()}@residence.local`;
        const tempPassword = randomBytes(24).toString('base64url');

        const { data: created, error: createError } =
          await this.supabaseAdmin.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              username: user.username,
              displayName: user.displayName,
              societyId: user.societyId,
              legacyId: user.id,
            },
          });

        if (createError || !created.user) {
          this.logger.warn(
            `Failed to create Supabase user for ${user.username}: ${createError?.message}`,
          );
          return null;
        }

        authUserId = created.user.id;

        // Store the link
        await this.prisma.userAccount.update({
          where: { id: user.id },
          data: {
            authUserId,
            authMigrationState: 'IMPORTED',
            authMigratedAt: new Date(),
          } as any,
        });
      }

      // Generate admin session (bypass email/password)
      const { data: sessionData, error: sessionError } =
        await this.supabaseAdmin.admin.createSession({
          userId: authUserId,
        } as { userId: string });

      if (sessionError || !sessionData?.session) {
        this.logger.warn(
          `Failed to create Supabase session for ${user.username}: ${sessionError?.message}`,
        );
        return null;
      }

      // Mark as verified on first successful session
      if (
        (user as any).authMigrationState === 'IMPORTED' ||
        (user as any).authMigrationState === 'PENDING'
      ) {
        await this.prisma.userAccount
          .update({
            where: { id: user.id },
            data: { authMigrationState: 'VERIFIED' } as any,
          })
          .catch(() => void 0); // non-blocking
      }

      return {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      };
    } catch (err) {
      this.logger.error(
        `Supabase session provisioning failed for ${user?.username}: ${String(err)}`,
      );
      return null;
    }
  }

  async logout(user: RequestUser, metadata: RequestMetadata): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { id: user.sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'USER_LOGOUT' },
    });
    await this.audit.recordSafely({
      societyId: user.societyId,
      actorUserId: user.id,
      action: 'LOGOUT',
      targetType: 'UserSession',
      targetId: user.sessionId,
      outcome: 'SUCCESS',
      correlationId: metadata.correlationId,
      sourceIp: metadata.sourceIp,
    });
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    metadata: RequestMetadata,
  ): Promise<void> {
    const identifier = dto.identifier.trim().toUpperCase();
    const user = await this.prisma.userAccount.findFirst({
      where: {
        OR: [
          { normalizedUsername: identifier },
          { normalizedEmail: identifier },
        ],
        status: 'ACTIVE',
      },
    });
    if (user) {
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(
        Date.now() +
          this.config.getOrThrow<number>('password.resetTtlMinutes') * 60_000,
      );
      const resetRecord = await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: this.digest(token), expiresAt },
      });
      await this.prisma.outboxEvent.create({
        data: {
          aggregateType: 'UserAccount',
          aggregateId: user.id,
          eventType: 'PASSWORD_RESET_REQUESTED',
          deduplicationKey: randomUUID(),
          payload: {
            userId: user.id,
            resetTokenId: resetRecord.id,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });
      await this.audit.recordSafely({
        societyId: user.societyId,
        actorUserId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        targetType: 'UserAccount',
        targetId: user.id,
        outcome: 'SUCCESS',
        correlationId: metadata.correlationId,
        sourceIp: metadata.sourceIp,
      });
    }
  }

  async resetPassword(
    dto: ResetPasswordDto,
    metadata: RequestMetadata,
  ): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.digest(dto.token) },
      include: { user: true },
    });
    if (
      !record ||
      record.usedAt ||
      record.expiresAt <= new Date() ||
      record.user.status !== 'ACTIVE'
    )
      throw new BadRequestException('The reset link is invalid or expired.');
    const passwordHash = await this.passwords.hash(dto.newPassword);
    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new BadRequestException('The reset link is invalid or expired.');
      await transaction.userAccount.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          forcePasswordChange: false,
          passwordChangedAt: new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });
      await transaction.userSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'PASSWORD_RESET' },
      });
    });
    await this.audit.recordSafely({
      societyId: record.user.societyId,
      actorUserId: record.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      targetType: 'UserAccount',
      targetId: record.userId,
      outcome: 'SUCCESS',
      correlationId: metadata.correlationId,
      sourceIp: metadata.sourceIp,
    });
  }

  async changePassword(
    user: RequestUser,
    dto: ChangePasswordDto,
    metadata: RequestMetadata,
  ): Promise<void> {
    const account = await this.prisma.userAccount.findUniqueOrThrow({
      where: { id: user.id },
    });
    if (
      !(await this.passwords.verify(account.passwordHash, dto.currentPassword))
    )
      throw new BadRequestException('The current password is incorrect.');
    const passwordHash = await this.passwords.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.userAccount.update({
        where: { id: user.id },
        data: {
          passwordHash,
          forcePasswordChange: false,
          passwordChangedAt: new Date(),
        },
      }),
      this.prisma.userSession.updateMany({
        where: {
          userId: user.id,
          id: { not: user.sessionId },
          revokedAt: null,
        },
        data: { revokedAt: new Date(), revokedReason: 'PASSWORD_CHANGED' },
      }),
    ]);
    await this.audit.recordSafely({
      societyId: user.societyId,
      actorUserId: user.id,
      action: 'PASSWORD_CHANGED',
      targetType: 'UserAccount',
      targetId: user.id,
      outcome: 'SUCCESS',
      correlationId: metadata.correlationId,
      sourceIp: metadata.sourceIp,
    });
  }

  private digest(value: string): string {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('session.secret'),
    )
      .update(value)
      .digest('hex');
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException(
      'The username/email or password is incorrect.',
    );
  }
}
