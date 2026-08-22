/**
 * Residence.io — Secure Super Admin Bootstrap Script
 *
 * Safely creates or promotes a Super Administrator account.
 * Requires an existing, active, and fully configured SUPER_ADMINISTRATOR role in the target society.
 * Never creates roles, seeds permissions, or guesses societies.
 * Never silently resets passwords, overwrites credentials, or reactivates suspended users.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';
import { PERMISSIONS } from '@residence/shared';
import { PrismaClient } from '../apps/api/src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  process.stderr.write(
    'ERROR: DATABASE_URL is required to bootstrap Super Admin.\n',
  );
  process.exit(1);
}

const username = (process.env.SUPER_ADMIN_USERNAME || 'superadmin')
  .trim()
  .toLowerCase();
const email = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@residence.local')
  .trim()
  .toLowerCase();
const initialPassword =
  process.env.SUPER_ADMIN_INITIAL_PASSWORD ||
  process.env.RESIDENCE_SEED_PASSWORD;
const societySlug = process.env.SUPER_ADMIN_SOCIETY_SLUG?.trim();
const societyId = process.env.SUPER_ADMIN_SOCIETY_ID?.trim();
const allowPromotion =
  process.env.SUPER_ADMIN_ALLOW_PROMOTION === 'true' ||
  process.argv.includes('--allow-promotion');

if (!societySlug && !societyId) {
  process.stderr.write(
    'ERROR: SUPER_ADMIN_SOCIETY_SLUG or SUPER_ADMIN_SOCIETY_ID must be explicitly specified. Automatic society guessing is disabled.\n',
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function bootstrap() {
  try {
    // 1. Verify Explicit Society
    const society = await prisma.society.findFirst({
      where: societyId ? { id: societyId } : { slug: societySlug },
    });

    if (!society) {
      process.stderr.write(
        `ERROR: [SOCIETY_NOT_FOUND] Specified society '${societySlug || societyId}' was not found. Society creation belongs to a separate controlled workflow.\n`,
      );
      process.exit(1);
    }

    if (society.archivedAt !== null || society.status === 'ARCHIVED') {
      process.stderr.write(
        `ERROR: [SOCIETY_INACTIVE] Specified society '${societySlug || societyId}' is archived or inactive.\n`,
      );
      process.exit(1);
    }

    // 2. Require Canonical SUPER_ADMINISTRATOR Role & Permissions (RBAC Precondition)
    const superAdminRole = await prisma.role.findFirst({
      where: {
        societyId: society.id,
        code: 'SUPER_ADMINISTRATOR',
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!superAdminRole) {
      process.stderr.write(
        `ERROR: [RBAC_NOT_READY] SUPER_ADMINISTRATOR role does not exist for society '${society.slug}'. Complete canonical RBAC seeding/migration before bootstrapping Super Admin.\n`,
      );
      process.exit(1);
    }

    if (!superAdminRole.active) {
      process.stderr.write(
        `ERROR: [RBAC_NOT_READY] SUPER_ADMINISTRATOR role for society '${society.slug}' is inactive. Activate role before bootstrapping Super Admin.\n`,
      );
      process.exit(1);
    }

    const assignedPermissionCodes = new Set(
      superAdminRole.permissions.map((rp) => rp.permission.code),
    );
    const requiredPermissionCodes = Object.values(PERMISSIONS);
    const missingPermissions = requiredPermissionCodes.filter(
      (code) => !assignedPermissionCodes.has(code),
    );

    if (missingPermissions.length > 0) {
      process.stderr.write(
        `ERROR: [RBAC_NOT_READY] SUPER_ADMINISTRATOR role for society '${society.slug}' has incomplete permissions (${assignedPermissionCodes.size}/${requiredPermissionCodes.length} present). Missing: ${missingPermissions.join(', ')}. Complete canonical RBAC migration first.\n`,
      );
      process.exit(1);
    }

    const normalizedUsername = username.toUpperCase();
    const normalizedEmail = email.toUpperCase();

    // 3. Check Existing User
    const existingUser = await prisma.userAccount.findFirst({
      where: {
        societyId: society.id,
        OR: [{ normalizedUsername }, { normalizedEmail }],
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // CASE B: Matching user exists and already has SUPER_ADMINISTRATOR
    if (existingUser) {
      const hasSuperAdminRole = existingUser.roles.some(
        (ur) => ur.role.code === 'SUPER_ADMINISTRATOR',
      );

      if (hasSuperAdminRole) {
        process.stdout.write(
          JSON.stringify({
            success: true,
            result: 'ALREADY_BOOTSTRAPPED',
            message:
              'Matching user account already exists with SUPER_ADMINISTRATOR role. No changes made.',
            username: existingUser.username,
            societyId: society.id,
            societySlug: society.slug,
            status: existingUser.status,
            role: 'SUPER_ADMINISTRATOR',
          }) + '\n',
        );
        return;
      }

      // CASE D: Existing user is SUSPENDED or DEACTIVATED or ARCHIVED
      if (
        existingUser.status === 'SUSPENDED' ||
        existingUser.status === 'DEACTIVATED' ||
        existingUser.status === 'ARCHIVED'
      ) {
        process.stderr.write(
          `ERROR: Existing user '${existingUser.username}' is in status '${existingUser.status}'. Cannot promote a non-active account. Resolve account lifecycle state first.\n`,
        );
        process.exit(1);
      }

      // CASE C: Matching user exists but role missing
      if (!allowPromotion) {
        process.stderr.write(
          `ERROR: Matching user '${existingUser.username}' exists in society '${society.slug}' but does not have the SUPER_ADMINISTRATOR role. Set SUPER_ADMIN_ALLOW_PROMOTION=true (or pass --allow-promotion) to authorize role assignment without credential alteration.\n`,
        );
        process.exit(1);
      }

      // Explicit promotion authorized
      await prisma.$transaction(async (tx) => {
        await tx.userRole.create({
          data: {
            societyId: society.id,
            userId: existingUser.id,
            roleId: superAdminRole.id,
          },
        });

        await tx.auditLog.create({
          data: {
            societyId: society.id,
            actorUserId: null,
            action: 'SUPER_ADMIN_PROMOTED',
            targetType: 'UserAccount',
            targetId: existingUser.id,
            outcome: 'SUCCESS',
            reason:
              'Super Administrator role assigned to existing user via bootstrap with explicit authorization',
            sourceIp: 'cli',
            safeMetadata: {
              source: 'bootstrap_script',
              username: existingUser.username,
              societySlug: society.slug,
              role: 'SUPER_ADMINISTRATOR',
              promotionAuthorized: true,
            },
          },
        });
      });

      process.stdout.write(
        JSON.stringify({
          success: true,
          result: 'PROMOTED',
          message:
            'Assigned canonical SUPER_ADMINISTRATOR role to existing user account without altering credentials or lifecycle status.',
          username: existingUser.username,
          societyId: society.id,
          societySlug: society.slug,
          status: existingUser.status,
          role: 'SUPER_ADMINISTRATOR',
        }) + '\n',
      );
      return;
    }

    // CASE A: No matching user exists -> create new account
    if (!initialPassword || initialPassword.length < 12) {
      process.stderr.write(
        'ERROR: SUPER_ADMIN_INITIAL_PASSWORD or RESIDENCE_SEED_PASSWORD with at least 12 characters is required to create a new Super Admin.\n',
      );
      process.exit(1);
    }

    const passwordHash = await hash(initialPassword);

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.userAccount.create({
        data: {
          societyId: society.id,
          username,
          normalizedUsername,
          email,
          normalizedEmail,
          displayName: 'Super Administrator',
          passwordHash,
          status: 'ACTIVE',
          forcePasswordChange: true,
        },
      });

      await tx.userRole.create({
        data: {
          societyId: society.id,
          userId: createdUser.id,
          roleId: superAdminRole.id,
        },
      });

      await tx.auditLog.create({
        data: {
          societyId: society.id,
          actorUserId: null,
          action: 'SUPER_ADMIN_BOOTSTRAPPED',
          targetType: 'UserAccount',
          targetId: createdUser.id,
          outcome: 'SUCCESS',
          reason: 'Super Administrator initial bootstrap script executed',
          sourceIp: 'cli',
          safeMetadata: {
            source: 'bootstrap_script',
            username: createdUser.username,
            societySlug: society.slug,
            role: 'SUPER_ADMINISTRATOR',
          },
        },
      });

      return createdUser;
    });

    process.stdout.write(
      JSON.stringify({
        success: true,
        result: 'CREATED',
        message:
          'Super Administrator account created and assigned canonical SUPER_ADMINISTRATOR role successfully.',
        username: newUser.username,
        societyId: society.id,
        societySlug: society.slug,
        status: newUser.status,
        role: 'SUPER_ADMINISTRATOR',
      }) + '\n',
    );
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap().catch((err) => {
  process.stderr.write('Super Admin bootstrap failed: ' + err.message + '\n');
  process.exit(1);
});
