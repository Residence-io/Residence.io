import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';
import { PERMISSIONS, ROLE_CODES } from '@residence/shared';
import { PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
const configuredSeedPassword = process.env.RESIDENCE_SEED_PASSWORD;
if (process.env.NODE_ENV === 'production')
  throw new Error('Development seed is disabled in production.');
if (!databaseUrl || !configuredSeedPassword)
  throw new Error(
    'DATABASE_URL and RESIDENCE_SEED_PASSWORD are required to seed development data.',
  );
const seedPassword: string = configuredSeedPassword;
if (
  seedPassword.length < 12 ||
  /change[-_ ]?me|placeholder/i.test(seedPassword)
)
  throw new Error(
    'RESIDENCE_SEED_PASSWORD must be a non-placeholder local password with at least 12 characters.',
  );

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const rolePermissions: Record<string, string[]> = {
  [ROLE_CODES.SUPER_ADMINISTRATOR]: Object.values(PERMISSIONS),
  [ROLE_CODES.ADMINISTRATOR]: [
    PERMISSIONS.RESIDENT_READ,
    PERMISSIONS.RESIDENT_CREATE,
    PERMISSIONS.RESIDENT_UPDATE,
    PERMISSIONS.RESIDENT_STATUS_CHANGE,
    PERMISSIONS.RESIDENT_ARCHIVE,
    PERMISSIONS.RESIDENT_DOCUMENT_READ,
    PERMISSIONS.RESIDENT_DOCUMENT_MANAGE,
    PERMISSIONS.RESIDENT_ID_CARD_MANAGE,
    PERMISSIONS.PROPERTY_MANAGE,
    PERMISSIONS.ACCESS_ADMIN_MANAGE,
    PERMISSIONS.SOCIETY_SETTING_MANAGE,
    PERMISSIONS.BILLING_DUE_READ,
    PERMISSIONS.BILLING_FEE_MANAGE,
    PERMISSIONS.PAYMENT_RECORD,
    PERMISSIONS.PAYMENT_VERIFY,
    PERMISSIONS.PAYMENT_ADJUST,
    PERMISSIONS.PAYMENT_WAIVE,
    PERMISSIONS.PAYMENT_REVERSE,
    PERMISSIONS.FINANCIAL_REPORT_EXPORT,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.STAFF_DOCUMENT_READ,
    PERMISSIONS.SALARY_READ,
    PERMISSIONS.SALARY_PAY,
    PERMISSIONS.SALARY_REVERSE,
    PERMISSIONS.WORKER_MANAGE,
    PERMISSIONS.WORKER_SCHEDULE,
    PERMISSIONS.WORKER_PERFORMANCE,
    PERMISSIONS.WORKFORCE_EXPORT,
    PERMISSIONS.COMPLAINT_READ,
    PERMISSIONS.COMPLAINT_MANAGE,
    PERMISSIONS.COMPLAINT_SENSITIVE_READ,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_MANAGE,
    PERMISSIONS.VISITOR_VIEW,
    PERMISSIONS.VISITOR_CREATE,
    PERMISSIONS.VISITOR_APPROVE,
    PERMISSIONS.VISITOR_ADMIN,
    PERMISSIONS.VISITOR_CHECK_IN,
    PERMISSIONS.VISITOR_CHECK_OUT,
    PERMISSIONS.TICKET_EXPORT,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.NOTIFICATION_TEMPLATE_MANAGE,
    PERMISSIONS.NOTIFICATION_LOG_READ,
    PERMISSIONS.ANNOUNCEMENT_MANAGE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.PROFILE_CORRECTION_MANAGE,
  ],
  [ROLE_CODES.ACCOUNTS_MANAGER]: [
    PERMISSIONS.RESIDENT_READ,
    PERMISSIONS.BILLING_DUE_READ,
    PERMISSIONS.BILLING_FEE_MANAGE,
    PERMISSIONS.PAYMENT_RECORD,
    PERMISSIONS.PAYMENT_VERIFY,
    PERMISSIONS.PAYMENT_ADJUST,
    PERMISSIONS.PAYMENT_WAIVE,
    PERMISSIONS.PAYMENT_REVERSE,
    PERMISSIONS.FINANCIAL_REPORT_EXPORT,
    PERMISSIONS.SALARY_READ,
    PERMISSIONS.SALARY_PAY,
    PERMISSIONS.SALARY_REVERSE,
    PERMISSIONS.WORKFORCE_EXPORT,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.NOTIFICATION_LOG_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
  ],
  [ROLE_CODES.MAINTENANCE_MANAGER]: [
    PERMISSIONS.RESIDENT_READ,
    PERMISSIONS.WORKER_MANAGE,
    PERMISSIONS.WORKER_SCHEDULE,
    PERMISSIONS.WORKER_PERFORMANCE,
    PERMISSIONS.WORKFORCE_EXPORT,
    PERMISSIONS.COMPLAINT_MANAGE,
    PERMISSIONS.COMPLAINT_READ,
    PERMISSIONS.MAINTENANCE_MANAGE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.TICKET_EXPORT,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.NOTIFICATION_LOG_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
  ],
  [ROLE_CODES.RESIDENT]: [],
  [ROLE_CODES.SECURITY_GUARD]: [
    PERMISSIONS.VISITOR_VIEW,
    PERMISSIONS.VISITOR_CREATE,
    PERMISSIONS.VISITOR_CHECK_IN,
    PERMISSIONS.VISITOR_CHECK_OUT,
  ],
};

async function main() {
  const society = await prisma.society.upsert({
    where: { slug: 'demo-residence' },
    update: { name: 'Residence.io Demo Society' },
    create: { slug: 'demo-residence', name: 'Residence.io Demo Society' },
  });
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: code.toLowerCase().replaceAll('_', ' ') },
    });
  }
  for (const [code, permissions] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { uk_role_society_code: { societyId: society.id, code } },
      update: { active: true },
      create: {
        societyId: society.id,
        code,
        displayName: code
          .toLowerCase()
          .split('_')
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join(' '),
        systemRole: true,
      },
    });
    for (const permissionCode of permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  const passwordHash = await hash(seedPassword, {
    type: 2,
    memoryCost: 19456,
    timeCost: 3,
    parallelism: 1,
  });
  const personas = [
    {
      username: 'superadmin',
      email: 'superadmin@example.test',
      displayName: 'Development Super Administrator',
      role: ROLE_CODES.SUPER_ADMINISTRATOR,
      force: false,
    },
    {
      username: 'resident',
      email: 'resident@example.test',
      displayName: 'Development Resident',
      role: ROLE_CODES.RESIDENT,
      force: false,
    },
  ];
  for (const persona of personas) {
    const user = await prisma.userAccount.upsert({
      where: { normalizedUsername: persona.username.toUpperCase() },
      update: { displayName: persona.displayName },
      create: {
        societyId: society.id,
        username: persona.username,
        normalizedUsername: persona.username.toUpperCase(),
        email: persona.email,
        normalizedEmail: persona.email.toUpperCase(),
        displayName: persona.displayName,
        passwordHash,
        status: 'ACTIVE',
        forcePasswordChange: persona.force,
      },
    });
    const role = await prisma.role.findUniqueOrThrow({
      where: {
        uk_role_society_code: { societyId: society.id, code: persona.role },
      },
    });
    await prisma.userRole.upsert({
      where: {
        societyId_userId_roleId: {
          societyId: society.id,
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: { societyId: society.id, userId: user.id, roleId: role.id },
    });
  }

  const residentUser = await prisma.userAccount.findUniqueOrThrow({
    where: { normalizedUsername: 'RESIDENT' },
  });
  const property = await prisma.property.upsert({
    where: {
      uk_property_society_address: {
        societyId: society.id,
        normalizedAddressKey: 'A|DEMO STREET|101',
      },
    },
    update: { active: true },
    create: {
      societyId: society.id,
      block: 'A',
      street: 'Demo Street',
      propertyNumber: '101',
      normalizedAddressKey: 'A|DEMO STREET|101',
      type: 'HOUSE',
    },
  });
  const unit = await prisma.unit.upsert({
    where: {
      uk_unit_property_number: {
        propertyId: property.id,
        normalizedUnitNumber: '1',
      },
    },
    update: { status: 'OCCUPIED' },
    create: {
      propertyId: property.id,
      unitNumber: '1',
      normalizedUnitNumber: '1',
      status: 'OCCUPIED',
    },
  });
  const resident = await prisma.resident.upsert({
    where: {
      uk_resident_society_number: {
        societyId: society.id,
        residentNumber: 'RES-DEMO-0001',
      },
    },
    update: { userId: residentUser.id, status: 'ACTIVE' },
    create: {
      societyId: society.id,
      userId: residentUser.id,
      residentNumber: 'RES-DEMO-0001',
      fullName: 'Development Resident',
      normalizedFullName: 'DEVELOPMENT RESIDENT',
      primaryPhone: '+923000000001',
      email: 'resident@example.test',
      status: 'ACTIVE',
    },
  });
  const currentOccupancy = await prisma.residentOccupancy.findFirst({
    where: { residentId: resident.id, unitId: unit.id, endDate: null },
  });
  if (!currentOccupancy) {
    await prisma.residentOccupancy.create({
      data: {
        residentId: resident.id,
        unitId: unit.id,
        occupancyType: 'OWNER',
        primaryResident: true,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  }
}

void main()
  .catch(() => {
    process.stderr.write(
      'Development seed failed. Review the database connection and local configuration.\n',
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
