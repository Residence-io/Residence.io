import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';
import { assertDemoSeedAllowed } from './demo-seed-safety';

assertDemoSeedAllowed(process.env);

const DEMO = 'residence-demo-v1';
const CURRENCY = 'PKR';
let currentStage = 'initialization';
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

function stableUuid(key: string): string {
  const hex = createHash('sha256').update(`${DEMO}:${key}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function monthStart(offset: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1),
  );
}

function monthEnd(offset: number): Date {
  return new Date(monthStart(offset + 1).getTime() - 86_400_000);
}

function monthDate(offset: number, day: number, hour = 9): Date {
  const start = monthStart(offset);
  return new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), day, hour),
  );
}

async function writeDemoPdf(
  ownerId: string,
  key: string,
  title: string,
  lines: string[],
): Promise<string> {
  const document = await PDFDocument.create();
  const page = document.addPage([595.28, 841.89]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  page.drawText(title, { x: 48, y: 785, size: 18, font: bold });
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: 48,
      y: 750 - index * 24,
      size: 11,
      font: regular,
    });
  });
  const objectKey = `${ownerId}/${stableUuid(`pdf:${key}`)}.pdf`;
  const path = resolve(
    process.env.PRIVATE_STORAGE_ROOT ?? 'var/private',
    objectKey,
  );
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path, Buffer.from(await document.save()));
  return objectKey;
}

interface DemoResident {
  id: string;
  userId: string;
  unitId: string;
  number: string;
}

async function createLedgerIfMissing(
  data: Prisma.FinancialLedgerEntryUncheckedCreateInput,
): Promise<void> {
  const existing = await prisma.financialLedgerEntry.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    select: { id: true },
  });
  if (!existing) {
    await prisma.financialLedgerEntry.create({
      data,
      select: { id: true },
    });
  }
}

async function seedProperties(societyId: string) {
  const blocks = ['A', 'B', 'C', 'D', 'E'];
  const units: Array<{ id: string; block: string; number: string }> = [];
  for (let index = 0; index < 60; index += 1) {
    const block = blocks[Math.floor(index / 12)];
    const number = String(101 + (index % 12));
    const propertyId = stableUuid(`property:${index}`);
    const unitId = stableUuid(`unit:${index}`);
    await prisma.property.upsert({
      where: { id: propertyId },
      update: {
        societyId,
        block,
        street: `${block} Demo Avenue`,
        propertyNumber: number,
        normalizedAddressKey: `${block}|DEMO AVENUE|${number}`,
        type:
          index % 9 === 0
            ? 'COMMERCIAL'
            : index % 3 === 0
              ? 'APARTMENT'
              : 'HOUSE',
        active: true,
      },
      create: {
        id: propertyId,
        societyId,
        block,
        street: `${block} Demo Avenue`,
        propertyNumber: number,
        normalizedAddressKey: `${block}|DEMO AVENUE|${number}`,
        type:
          index % 9 === 0
            ? 'COMMERCIAL'
            : index % 3 === 0
              ? 'APARTMENT'
              : 'HOUSE',
      },
    });
    await prisma.unit.upsert({
      where: { id: unitId },
      update: {
        propertyId,
        unitNumber: number,
        normalizedUnitNumber: number,
        status: index < 40 ? 'OCCUPIED' : 'AVAILABLE',
      },
      create: {
        id: unitId,
        propertyId,
        unitNumber: number,
        normalizedUnitNumber: number,
        status: index < 40 ? 'OCCUPIED' : 'AVAILABLE',
        parkingInformation: index % 4 === 0 ? `Bay ${block}-${number}` : null,
      },
    });
    units.push({ id: unitId, block, number });
  }
  return units;
}

async function seedResidents(
  societyId: string,
  residentRoleId: string,
  passwordHash: string,
  units: Array<{ id: string; block: string; number: string }>,
) {
  const residents: DemoResident[] = [];
  for (let index = 0; index < 40; index += 1) {
    const suffix = String(index + 1).padStart(2, '0');
    const username = index === 0 ? 'demo.resident' : `demo.resident.${suffix}`;
    const email =
      index === 0
        ? 'demo.resident@example.test'
        : `demo.resident.${suffix}@example.test`;
    const fullName =
      index === 0 ? 'Avery Demo Resident' : `Synthetic Resident ${suffix}`;
    const userStatus =
      index >= 37 ? 'DEACTIVATED' : index >= 34 ? 'SUSPENDED' : 'ACTIVE';
    const residentStatus =
      index >= 37 ? 'INACTIVE' : index >= 34 ? 'SUSPENDED' : 'ACTIVE';
    const user = await prisma.userAccount.upsert({
      where: { normalizedUsername: username.toUpperCase() },
      update: {
        societyId,
        displayName: fullName,
        passwordHash,
        status: userStatus,
        forcePasswordChange: false,
      },
      create: {
        id: stableUuid(`user:${index}`),
        societyId,
        username,
        normalizedUsername: username.toUpperCase(),
        email,
        normalizedEmail: email.toUpperCase(),
        displayName: fullName,
        passwordHash,
        status: userStatus,
        forcePasswordChange: false,
        emailVerified: true,
      },
    });
    await prisma.userRole.upsert({
      where: {
        societyId_userId_roleId: {
          societyId,
          userId: user.id,
          roleId: residentRoleId,
        },
      },
      update: {},
      create: { societyId, userId: user.id, roleId: residentRoleId },
    });
    const residentId = stableUuid(`resident:${index}`);
    const residentNumber = `RES-RICH-${String(index + 1).padStart(4, '0')}`;
    await prisma.resident.upsert({
      where: { id: residentId },
      update: {
        societyId,
        userId: user.id,
        residentNumber,
        fullName,
        normalizedFullName: fullName.toUpperCase(),
        status: residentStatus,
      },
      create: {
        id: residentId,
        societyId,
        userId: user.id,
        residentNumber,
        fullName,
        normalizedFullName: fullName.toUpperCase(),
        guardianName: `Demo Contact ${suffix}`,
        dateOfBirth: new Date(
          Date.UTC(1980 + (index % 18), index % 12, 1 + (index % 25)),
        ),
        gender: index % 3 === 0 ? 'FEMALE' : index % 3 === 1 ? 'MALE' : 'OTHER',
        email,
        primaryPhone: `+999555${String(index + 1).padStart(6, '0')}`,
        alternatePhone: `+999556${String(index + 1).padStart(6, '0')}`,
        permanentAddress: `${units[index].block} Demo Avenue, Fictional Lahore`,
        emergencyContactName: `Synthetic Emergency Contact ${suffix}`,
        emergencyContactPhone: `+999557${String(index + 1).padStart(6, '0')}`,
        householdSize: 1 + (index % 5),
        status: residentStatus,
        suspensionReason:
          residentStatus === 'SUSPENDED'
            ? 'Synthetic account review scenario'
            : null,
      },
    });
    const tenant = index % 3 === 0;
    await prisma.residentOccupancy.upsert({
      where: { id: stableUuid(`occupancy:${index}`) },
      update: {
        residentId,
        unitId: units[index].id,
        occupancyType: tenant ? 'TENANT' : 'OWNER',
        primaryResident: true,
        startDate: monthStart(-((index % 24) + 1)),
        endDate: null,
      },
      create: {
        id: stableUuid(`occupancy:${index}`),
        residentId,
        unitId: units[index].id,
        occupancyType: tenant ? 'TENANT' : 'OWNER',
        primaryResident: true,
        startDate: monthStart(-((index % 24) + 1)),
        propertyOwnerName: tenant ? `Demo Property Owner ${suffix}` : null,
        propertyOwnerPhone: tenant
          ? `+999558${String(index + 1).padStart(6, '0')}`
          : null,
        propertyOwnerEmail: tenant ? `demo.owner.${suffix}@example.test` : null,
        tenancyStartDate: tenant ? monthStart(-12) : null,
        tenancyEndDate: tenant ? monthEnd(12) : null,
      },
    });
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        societyId,
        emailEnabled: true,
        smsEnabled: index % 2 === 0,
        inAppEnabled: true,
        paymentReminders: true,
        generalAnnouncements: true,
        maintenanceUpdates: true,
        complaintUpdates: true,
      },
      create: {
        id: stableUuid(`preference:${index}`),
        societyId,
        userId: user.id,
        emailEnabled: true,
        smsEnabled: index % 2 === 0,
        inAppEnabled: true,
        paymentReminders: true,
        generalAnnouncements: true,
        maintenanceUpdates: true,
        complaintUpdates: true,
        preferredLanguage: index % 5 === 0 ? 'ur' : 'en',
        quietHoursStart: 22,
        quietHoursEnd: 7,
      },
    });
    await prisma.residentCreditBalance.upsert({
      where: { residentId },
      update: {
        amount: index === 0 ? 2500 : index % 11 === 0 ? 1500 : 0,
        currency: CURRENCY,
      },
      create: {
        residentId,
        amount: index === 0 ? 2500 : index % 11 === 0 ? 1500 : 0,
        currency: CURRENCY,
      },
    });
    residents.push({
      id: residentId,
      userId: user.id,
      unitId: units[index].id,
      number: residentNumber,
    });
  }
  await prisma.householdMember.upsert({
    where: { id: stableUuid('household:primary') },
    update: { residentId: residents[0].id, status: 'ACTIVE' },
    create: {
      id: stableUuid('household:primary'),
      residentId: residents[0].id,
      fullName: 'Taylor Demo Household Member',
      relationship: 'Sibling',
      dateOfBirth: new Date('2002-04-12T00:00:00.000Z'),
      phone: '+999559000001',
      emergencyContact: true,
      status: 'ACTIVE',
    },
  });
  await prisma.vehicle.upsert({
    where: { id: stableUuid('vehicle:primary') },
    update: { societyId, residentId: residents[0].id, active: true },
    create: {
      id: stableUuid('vehicle:primary'),
      societyId,
      residentId: residents[0].id,
      type: 'Car',
      manufacturer: 'Fictional Motors',
      model: 'Demo One',
      colour: 'Silver',
      registrationNumber: 'DEMO-0001',
      normalizedRegistrationNumber: 'DEMO-0001',
      parkingPermitNumber: 'DEMO-PARK-01',
      parkingLocation: 'A-01',
      active: true,
    },
  });
  return residents;
}

async function seedFinance(
  societyId: string,
  superadminId: string,
  residents: DemoResident[],
) {
  currentStage = 'finance fee plan';
  const feePlanId = stableUuid('fee-plan:standard');
  await prisma.feePlan.upsert({
    where: { id: feePlanId },
    update: {
      societyId,
      name: 'Synthetic Standard Monthly Fee',
      monthlyBaseAmount: new Prisma.Decimal(5000),
      active: true,
    },
    create: {
      id: feePlanId,
      societyId,
      name: 'Synthetic Standard Monthly Fee',
      description: 'Development-only fee plan for dashboard review.',
      scope: 'SOCIETY_DEFAULT',
      monthlyBaseAmount: new Prisma.Decimal(5000),
      currency: CURRENCY,
      effectiveFrom: monthStart(-24),
      dueDay: 10,
      gracePeriodDays: 5,
      lateFeeType: 'FIXED',
      lateFeeValue: new Prisma.Decimal(250),
      createdByUserId: superadminId,
    },
    select: { id: true },
  });
  for (const [index, resident] of residents.entries()) {
    currentStage = `finance fee assignment ${index}`;
    const monthlyAmount = 5000 + (index % 4) * 500;
    await prisma.residentFeeAssignment.upsert({
      where: { id: stableUuid(`fee-assignment:${index}`) },
      update: {
        residentId: resident.id,
        feePlanId,
        monthlyAmount: new Prisma.Decimal(monthlyAmount),
      },
      create: {
        id: stableUuid(`fee-assignment:${index}`),
        residentId: resident.id,
        feePlanId,
        monthlyAmount: new Prisma.Decimal(monthlyAmount),
        currency: CURRENCY,
        effectiveFrom: monthStart(-24),
        assignedByUserId: superadminId,
        reason: 'Synthetic demo assignment',
      },
    });
  }
  for (let offset = -11; offset <= 0; offset += 1) {
    currentStage = `finance billing period ${offset}`;
    const startsAt = monthStart(offset);
    const period = await prisma.billingPeriod.upsert({
      where: {
        uk_billing_period_society_month: {
          societyId,
          year: startsAt.getUTCFullYear(),
          month: startsAt.getUTCMonth() + 1,
        },
      },
      update: { startsAt, endsAt: monthEnd(offset) },
      create: {
        id: stableUuid(`billing-period:${offset}`),
        societyId,
        year: startsAt.getUTCFullYear(),
        month: startsAt.getUTCMonth() + 1,
        startsAt,
        endsAt: monthEnd(offset),
      },
    });
    for (const [residentIndex, resident] of residents.entries()) {
      currentStage = `finance due ${offset}:${residentIndex}`;
      const total = 5000 + (residentIndex % 4) * 500;
      const isPrimary = residentIndex === 0;
      const waived =
        !isPrimary && (residentIndex + offset + 24) % 17 === 0 ? 500 : 0;
      let paid = total - waived;
      let status: 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'OVERDUE' = 'PAID';
      if (isPrimary && offset === 0) {
        paid = 0;
        status = 'PENDING';
      } else if (isPrimary && offset === -1) {
        paid = 0;
        status = 'OVERDUE';
      } else if (isPrimary && offset === -2) {
        paid = 2500;
        status = 'PARTIALLY_PAID';
      } else if (!isPrimary && offset >= -2 && residentIndex % 9 === 0) {
        paid = 0;
        status = offset === 0 ? 'PENDING' : 'OVERDUE';
      } else if (!isPrimary && offset >= -3 && residentIndex % 7 === 0) {
        paid = Math.floor((total - waived) / 2);
        status = 'PARTIALLY_PAID';
      }
      const dueId = stableUuid(`due:${residentIndex}:${offset}`);
      const dueDate = monthDate(offset, 10, 0);
      currentStage = `finance monthly due ${offset}:${residentIndex}`;
      await prisma.monthlyDue.upsert({
        where: { id: dueId },
        update: {
          status,
          principalAmount: new Prisma.Decimal(total),
          totalAmount: new Prisma.Decimal(total),
          paidAmount: new Prisma.Decimal(paid),
          waivedAmount: new Prisma.Decimal(waived),
          dueDate,
          graceEndsAt: monthDate(offset, 15, 0),
        },
        create: {
          id: dueId,
          societyId,
          residentId: resident.id,
          billingPeriodId: period.id,
          feePlanId,
          status,
          currency: CURRENCY,
          principalAmount: new Prisma.Decimal(total),
          totalAmount: new Prisma.Decimal(total),
          paidAmount: new Prisma.Decimal(paid),
          waivedAmount: new Prisma.Decimal(waived),
          dueDate,
          graceEndsAt: monthDate(offset, 15, 0),
          feePlanSnapshot: {
            name: 'Synthetic Standard Monthly Fee',
            monthlyBaseAmount: total,
            currency: CURRENCY,
          },
          unitSnapshot: { unitId: resident.unitId },
        },
      });
      currentStage = `finance due line ${offset}:${residentIndex}`;
      await prisma.dueLineItem.upsert({
        where: { idempotencyKey: `${DEMO}:line:${residentIndex}:${offset}` },
        update: { amount: new Prisma.Decimal(total) },
        create: {
          id: stableUuid(`due-line:${residentIndex}:${offset}`),
          monthlyDueId: dueId,
          type: 'PRINCIPAL',
          description: 'Synthetic monthly society fee',
          amount: new Prisma.Decimal(total),
          calculationSnapshot: { source: DEMO },
          idempotencyKey: `${DEMO}:line:${residentIndex}:${offset}`,
        },
      });
      currentStage = `finance due ledger ${offset}:${residentIndex}`;
      await createLedgerIfMissing({
        id: stableUuid(`ledger-due:${residentIndex}:${offset}`),
        societyId,
        residentId: resident.id,
        monthlyDueId: dueId,
        type: 'MONTHLY_DUE',
        direction: 'DEBIT',
        amount: new Prisma.Decimal(total),
        currency: CURRENCY,
        eventDate: dueDate,
        reference: `DEMO-DUE-${residentIndex + 1}-${offset + 12}`,
        description: 'Synthetic monthly due',
        idempotencyKey: `${DEMO}:ledger:due:${residentIndex}:${offset}`,
      });
      if (waived > 0) {
        currentStage = `finance waiver ledger ${offset}:${residentIndex}`;
        await createLedgerIfMissing({
          id: stableUuid(`ledger-waiver:${residentIndex}:${offset}`),
          societyId,
          residentId: resident.id,
          monthlyDueId: dueId,
          type: 'WAIVER',
          direction: 'CREDIT',
          amount: new Prisma.Decimal(waived),
          currency: CURRENCY,
          eventDate: monthDate(offset, 11),
          reference: `DEMO-WAIVER-${residentIndex + 1}-${offset + 12}`,
          description: 'Synthetic approved waiver',
          idempotencyKey: `${DEMO}:ledger:waiver:${residentIndex}:${offset}`,
        });
      }
      if (paid <= 0) continue;
      currentStage = `finance payment ${offset}:${residentIndex}`;
      const paymentId = stableUuid(`payment:${residentIndex}:${offset}`);
      const paymentDate = monthDate(offset, 12 + (residentIndex % 8), 11);
      const method = ['CASH', 'BANK_TRANSFER', 'DIGITAL_WALLET'][
        (residentIndex + offset + 24) % 3
      ] as 'CASH' | 'BANK_TRANSFER' | 'DIGITAL_WALLET';
      await prisma.payment.upsert({
        where: { id: paymentId },
        update: {
          amount: new Prisma.Decimal(paid),
          paymentDate,
          method,
          status: 'CONFIRMED',
          confirmedAt: paymentDate,
        },
        create: {
          id: paymentId,
          societyId,
          residentId: resident.id,
          amount: new Prisma.Decimal(paid),
          currency: CURRENCY,
          paymentDate,
          method,
          status: 'CONFIRMED',
          transactionReference: `DEMO-PAY-${residentIndex + 1}-${offset + 12}`,
          idempotencyKey: `${DEMO}:payment:${residentIndex}:${offset}`,
          allocationStrategy: 'OLDEST_DUE_FIRST',
          notes: 'Synthetic confirmed payment',
          recordedByUserId: superadminId,
          confirmedAt: paymentDate,
        },
      });
      await prisma.paymentAllocation.upsert({
        where: {
          uk_payment_due_allocation: { paymentId, monthlyDueId: dueId },
        },
        update: { amount: new Prisma.Decimal(paid) },
        create: {
          id: stableUuid(`allocation:${residentIndex}:${offset}`),
          paymentId,
          monthlyDueId: dueId,
          amount: new Prisma.Decimal(paid),
        },
      });
      await createLedgerIfMissing({
        id: stableUuid(`ledger-payment:${residentIndex}:${offset}`),
        societyId,
        residentId: resident.id,
        monthlyDueId: dueId,
        paymentId,
        type: 'PAYMENT',
        direction: 'CREDIT',
        amount: new Prisma.Decimal(paid),
        currency: CURRENCY,
        eventDate: paymentDate,
        reference: `DEMO-PAY-${residentIndex + 1}-${offset + 12}`,
        description: 'Synthetic confirmed payment',
        idempotencyKey: `${DEMO}:ledger:payment:${residentIndex}:${offset}`,
      });
      if (isPrimary && offset <= -3) {
        currentStage = `finance receipt ${offset}`;
        const receiptNumber = `RCT-DEMO-${startsAt.getUTCFullYear()}-${String(
          startsAt.getUTCMonth() + 1,
        ).padStart(2, '0')}`;
        const objectKey = await writeDemoPdf(
          resident.id,
          `receipt:${offset}`,
          'Residence.io Demo Receipt',
          [
            `Receipt: ${receiptNumber}`,
            `Resident: ${resident.number}`,
            `Amount: ${CURRENCY} ${paid.toFixed(2)}`,
            'Entirely synthetic development data',
          ],
        );
        await prisma.receipt.upsert({
          where: { id: stableUuid(`receipt:${offset}`) },
          update: {
            paymentId,
            receiptNumber,
            pdfObjectKey: objectKey,
            status: 'ACTIVE',
          },
          create: {
            id: stableUuid(`receipt:${offset}`),
            paymentId,
            receiptNumber,
            verificationHash: digest(`${DEMO}:receipt:${offset}`),
            pdfObjectKey: objectKey,
            status: 'ACTIVE',
            issuedByUserId: superadminId,
            issuedAt: paymentDate,
          },
        });
      }
    }
  }
  currentStage = 'finance advance credit';
  await createLedgerIfMissing({
    id: stableUuid('ledger-advance:primary'),
    societyId,
    residentId: residents[0].id,
    type: 'ADVANCE_CREDIT',
    direction: 'CREDIT',
    amount: new Prisma.Decimal(2500),
    currency: CURRENCY,
    eventDate: monthDate(-1, 20),
    reference: 'DEMO-ADVANCE-PRIMARY',
    description: 'Synthetic advance credit balance',
    idempotencyKey: `${DEMO}:advance:${residents[0].id}`,
  });
}

async function seedWorkforce(societyId: string, superadminId: string) {
  const departmentNames = [
    'Administration',
    'Accounts',
    'Maintenance',
    'Security',
  ];
  const jobTitleNames = [
    'Coordinator',
    'Accounts Officer',
    'Maintenance Supervisor',
    'Security Officer',
  ];
  const departmentIds: string[] = [];
  const jobTitleIds: string[] = [];
  for (const [index, name] of departmentNames.entries()) {
    const departmentId = stableUuid(`department:${index}`);
    const jobTitleId = stableUuid(`job-title:${index}`);
    await prisma.department.upsert({
      where: { id: departmentId },
      update: { societyId, name, active: true },
      create: {
        id: departmentId,
        societyId,
        name,
        normalizedName: name.toUpperCase(),
        description: `Synthetic ${name.toLowerCase()} department`,
        displayOrder: index,
      },
    });
    await prisma.jobTitle.upsert({
      where: { id: jobTitleId },
      update: {
        societyId,
        departmentId,
        name: jobTitleNames[index],
        active: true,
      },
      create: {
        id: jobTitleId,
        societyId,
        departmentId,
        name: jobTitleNames[index],
        normalizedName: jobTitleNames[index].toUpperCase(),
        description: 'Synthetic development role',
        displayOrder: index,
      },
    });
    departmentIds.push(departmentId);
    jobTitleIds.push(jobTitleId);
  }
  const salaryPeriod = await prisma.salaryPeriod.upsert({
    where: {
      uk_salary_period_society_month: {
        societyId,
        year: monthStart(0).getUTCFullYear(),
        month: monthStart(0).getUTCMonth() + 1,
      },
    },
    update: { startsAt: monthStart(0), endsAt: monthEnd(0) },
    create: {
      id: stableUuid('salary-period:current'),
      societyId,
      year: monthStart(0).getUTCFullYear(),
      month: monthStart(0).getUTCMonth() + 1,
      startsAt: monthStart(0),
      endsAt: monthEnd(0),
    },
  });
  for (let index = 0; index < 10; index += 1) {
    const staffId = stableUuid(`staff:${index}`);
    const status =
      index === 8 ? 'ON_LEAVE' : index === 9 ? 'SUSPENDED' : 'ACTIVE';
    await prisma.staffMember.upsert({
      where: { id: staffId },
      update: {
        societyId,
        fullName: `Synthetic Staff Member ${index + 1}`,
        normalizedFullName: `SYNTHETIC STAFF MEMBER ${index + 1}`,
        status,
      },
      create: {
        id: staffId,
        societyId,
        staffNumber: `STF-DEMO-${String(index + 1).padStart(3, '0')}`,
        fullName: `Synthetic Staff Member ${index + 1}`,
        normalizedFullName: `SYNTHETIC STAFF MEMBER ${index + 1}`,
        email: `demo.staff.${index + 1}@example.test`,
        primaryPhone: `+999570${String(index + 1).padStart(6, '0')}`,
        address: 'Fictional Lahore',
        emergencyContactName: `Demo Staff Contact ${index + 1}`,
        emergencyContactPhone: `+999571${String(index + 1).padStart(6, '0')}`,
        status,
      },
    });
    const departmentIndex = index % departmentIds.length;
    await prisma.employmentRecord.upsert({
      where: { id: stableUuid(`employment:${index}`) },
      update: {
        staffId,
        departmentId: departmentIds[departmentIndex],
        jobTitleId: jobTitleIds[departmentIndex],
      },
      create: {
        id: stableUuid(`employment:${index}`),
        staffId,
        departmentId: departmentIds[departmentIndex],
        jobTitleId: jobTitleIds[departmentIndex],
        employmentType: index % 4 === 0 ? 'CONTRACT' : 'PERMANENT',
        joiningDate: monthStart(-(12 + index)),
        effectiveFrom: monthStart(-(12 + index)),
        workShift: index % 2 === 0 ? 'Morning' : 'Evening',
        paymentMethod: index % 3 === 0 ? 'CASH' : 'BANK_TRANSFER',
        notes: 'Synthetic employment record',
      },
    });
    const structureId = stableUuid(`salary-structure:${index}`);
    const basic = 45_000 + index * 3_000;
    const allowances = 5_000 + (index % 3) * 1_000;
    const deductions = index % 2 === 0 ? 1_000 : 1_500;
    const net = basic + allowances - deductions;
    await prisma.salaryStructure.upsert({
      where: { id: structureId },
      update: {
        basicSalary: new Prisma.Decimal(basic),
        fixedAllowances: new Prisma.Decimal(allowances),
        fixedDeductions: new Prisma.Decimal(deductions),
      },
      create: {
        id: structureId,
        staffId,
        basicSalary: new Prisma.Decimal(basic),
        fixedAllowances: new Prisma.Decimal(allowances),
        fixedDeductions: new Prisma.Decimal(deductions),
        frequency: 'MONTHLY',
        currency: CURRENCY,
        effectiveFrom: monthStart(-12),
        notes: 'Synthetic effective-dated salary',
        createdByUserId: superadminId,
      },
    });
    const amountPaid = index < 6 ? net : index < 8 ? Math.floor(net / 2) : 0;
    const recordStatus =
      amountPaid === net
        ? 'PAID'
        : amountPaid > 0
          ? 'PARTIALLY_PAID'
          : 'PENDING';
    const recordId = stableUuid(`salary-record:${index}`);
    await prisma.salaryRecord.upsert({
      where: { id: recordId },
      update: {
        salaryPeriodId: salaryPeriod.id,
        salaryStructureId: structureId,
        amountPaid: new Prisma.Decimal(amountPaid),
        status: recordStatus,
      },
      create: {
        id: recordId,
        staffId,
        salaryPeriodId: salaryPeriod.id,
        salaryStructureId: structureId,
        basicSalary: new Prisma.Decimal(basic),
        allowances: new Prisma.Decimal(allowances),
        deductions: new Prisma.Decimal(deductions),
        netPayable: new Prisma.Decimal(net),
        amountPaid: new Prisma.Decimal(amountPaid),
        currency: CURRENCY,
        status: recordStatus,
        salarySnapshot: { basic, allowances, deductions, source: DEMO },
        generatedByUserId: superadminId,
        generatedAt: monthDate(0, 2),
        paidAt: amountPaid === net ? monthDate(0, 5) : null,
        notes: 'Synthetic salary record',
      },
    });
    if (amountPaid > 0) {
      await prisma.salaryPayment.upsert({
        where: { id: stableUuid(`salary-payment:${index}`) },
        update: {
          salaryRecordId: recordId,
          amount: new Prisma.Decimal(amountPaid),
          status: 'CONFIRMED',
        },
        create: {
          id: stableUuid(`salary-payment:${index}`),
          salaryRecordId: recordId,
          amount: new Prisma.Decimal(amountPaid),
          currency: CURRENCY,
          method: index % 3 === 0 ? 'CASH' : 'BANK_TRANSFER',
          status: 'CONFIRMED',
          paymentDate: monthDate(0, 5),
          transactionReference: `DEMO-SALARY-${index + 1}`,
          notes: 'Synthetic salary payment',
          recordedByUserId: superadminId,
          idempotencyKey: `${DEMO}:salary-payment:${index}`,
        },
      });
    }
  }

  const categoryNames = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Security',
    'General',
  ];
  const categoryIds: string[] = [];
  const skillIds: string[] = [];
  for (const [index, name] of categoryNames.entries()) {
    const categoryId = stableUuid(`worker-category:${index}`);
    const skillId = stableUuid(`worker-skill:${index}`);
    await prisma.workerCategory.upsert({
      where: { id: categoryId },
      update: { societyId, name, active: true },
      create: {
        id: categoryId,
        societyId,
        code: `DEMO-${name.toUpperCase()}`,
        name,
        description: `Synthetic ${name.toLowerCase()} category`,
        defaultDurationMinutes: 90,
        defaultRate: new Prisma.Decimal(1500 + index * 250),
        currency: CURRENCY,
      },
    });
    await prisma.workerSkill.upsert({
      where: { id: skillId },
      update: { societyId, name: `${name} Service`, active: true },
      create: {
        id: skillId,
        societyId,
        name: `${name} Service`,
        normalizedName: `${name} Service`.toUpperCase(),
        description: `Synthetic ${name.toLowerCase()} skill`,
      },
    });
    categoryIds.push(categoryId);
    skillIds.push(skillId);
  }
  const workers: string[] = [];
  for (let index = 0; index < 15; index += 1) {
    const workerId = stableUuid(`worker:${index}`);
    const categoryIndex = index % categoryIds.length;
    const status = (
      ['AVAILABLE', 'AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_LEAVE'] as const
    )[index % 5];
    const serviceArea = ['North', 'Central', 'South'][index % 3];
    await prisma.serviceWorker.upsert({
      where: { id: workerId },
      update: {
        societyId,
        primaryCategoryId: categoryIds[categoryIndex],
        fullName: `Synthetic Service Worker ${index + 1}`,
        normalizedFullName: `SYNTHETIC SERVICE WORKER ${index + 1}`,
        status,
      },
      create: {
        id: workerId,
        societyId,
        workerNumber: `WRK-DEMO-${String(index + 1).padStart(3, '0')}`,
        primaryCategoryId: categoryIds[categoryIndex],
        fullName: `Synthetic Service Worker ${index + 1}`,
        normalizedFullName: `SYNTHETIC SERVICE WORKER ${index + 1}`,
        primaryPhone: `+999580${String(index + 1).padStart(6, '0')}`,
        email: `demo.worker.${index + 1}@example.test`,
        address: 'Fictional Lahore',
        emergencyContact: `Demo Worker Contact ${index + 1}`,
        relationship: index % 3 === 0 ? 'EXTERNAL_CONTRACTOR' : 'INTERNAL',
        experienceYears: 1 + (index % 12),
        serviceArea,
        registrationDate: monthStart(-(index + 3)),
        status,
        administrativeNotes: 'Synthetic worker profile',
      },
    });
    for (const [skillIndex, proficiency] of [
      [categoryIndex, 'Skilled'],
      [(categoryIndex + 1) % skillIds.length, 'Supporting'],
    ] as const) {
      await prisma.workerSkillAssignment.upsert({
        where: {
          workerId_skillId: { workerId, skillId: skillIds[skillIndex] },
        },
        update: { proficiency },
        create: {
          workerId,
          skillId: skillIds[skillIndex],
          proficiency,
        },
      });
    }
    for (let day = 1; day <= 5; day += 1) {
      await prisma.workerAvailability.upsert({
        where: {
          uk_worker_availability_window: {
            workerId,
            dayOfWeek: day,
            startMinute: 540,
            endMinute: 1020,
          },
        },
        update: { active: true, serviceArea },
        create: {
          id: stableUuid(`availability:${index}:${day}`),
          workerId,
          dayOfWeek: day,
          startMinute: 540,
          endMinute: 1020,
          serviceArea,
        },
      });
    }
    workers.push(workerId);
  }
  return { workers, categoryIds, skillIds };
}

async function seedTickets(
  societyId: string,
  superadminId: string,
  residents: DemoResident[],
  workers: string[],
  workerCategoryIds: string[],
  skillIds: string[],
) {
  const complaintNames = ['Community', 'Environment', 'Security', 'Noise'];
  const complaintCategoryIds: string[] = [];
  for (const [index, name] of complaintNames.entries()) {
    const id = stableUuid(`complaint-category:${index}`);
    await prisma.complaintCategory.upsert({
      where: { id },
      update: { societyId, name, active: true },
      create: {
        id,
        societyId,
        name,
        normalizedName: name.toUpperCase(),
        description: `Synthetic ${name.toLowerCase()} complaints`,
      },
    });
    complaintCategoryIds.push(id);
  }
  const maintenanceNames = ['Plumbing', 'Electrical', 'Cleaning', 'General'];
  const maintenanceCategoryIds: string[] = [];
  for (const [index, name] of maintenanceNames.entries()) {
    const id = stableUuid(`maintenance-category:${index}`);
    await prisma.maintenanceCategory.upsert({
      where: { id },
      update: {
        societyId,
        name,
        active: true,
        workerCategoryId: workerCategoryIds[index],
        requiredSkillId: skillIds[index],
      },
      create: {
        id,
        societyId,
        name,
        normalizedName: name.toUpperCase(),
        description: `Synthetic ${name.toLowerCase()} requests`,
        workerCategoryId: workerCategoryIds[index],
        requiredSkillId: skillIds[index],
      },
    });
    maintenanceCategoryIds.push(id);
  }
  const complaintStatuses = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ] as const;
  for (let index = 0; index < 18; index += 1) {
    const resident =
      index < 2 ? residents[0] : residents[(index - 1) % residents.length];
    const status =
      index === 0
        ? 'UNDER_REVIEW'
        : index === 1
          ? 'RESOLVED'
          : complaintStatuses[index % complaintStatuses.length];
    const createdAt = monthDate(-(index % 12), 3 + (index % 20));
    const resolved = ['RESOLVED', 'CLOSED'].includes(status);
    const overdue = index % 5 === 0 && !resolved;
    const complaintId = stableUuid(`complaint:${index}`);
    await prisma.complaint.upsert({
      where: { id: complaintId },
      update: {
        residentId: resident.id,
        unitId: resident.unitId,
        categoryId: complaintCategoryIds[index % complaintCategoryIds.length],
        status,
        priority:
          index % 9 === 0 ? 'EMERGENCY' : index % 4 === 0 ? 'HIGH' : 'NORMAL',
        targetResolutionAt: overdue
          ? new Date(createdAt.getTime() + 86_400_000)
          : new Date(createdAt.getTime() + 7 * 86_400_000),
        resolvedAt: resolved
          ? new Date(createdAt.getTime() + 2 * 86_400_000)
          : null,
        createdAt,
      },
      create: {
        id: complaintId,
        societyId,
        residentId: resident.id,
        unitId: resident.unitId,
        categoryId: complaintCategoryIds[index % complaintCategoryIds.length],
        ticketNumber: `CMP-DEMO-${String(index + 1).padStart(4, '0')}`,
        subject:
          index === 0
            ? 'Shared area review requested'
            : `Synthetic complaint scenario ${index + 1}`,
        description:
          'Entirely fictional complaint created for local dashboard review.',
        location: 'Synthetic shared area',
        residentUrgency: index % 4 === 0 ? 'HIGH' : 'NORMAL',
        priority:
          index % 9 === 0 ? 'EMERGENCY' : index % 4 === 0 ? 'HIGH' : 'NORMAL',
        privacy: 'STANDARD',
        preferredContactMethod: 'IN_APP',
        status,
        propertySnapshot: { source: DEMO, unitId: resident.unitId },
        targetResponseAt: new Date(createdAt.getTime() + 4 * 3_600_000),
        targetResolutionAt: overdue
          ? new Date(createdAt.getTime() + 86_400_000)
          : new Date(createdAt.getTime() + 7 * 86_400_000),
        respondedAt:
          status === 'SUBMITTED'
            ? null
            : new Date(createdAt.getTime() + 2 * 3_600_000),
        resolvedAt: resolved
          ? new Date(createdAt.getTime() + 2 * 86_400_000)
          : null,
        closedAt:
          status === 'CLOSED'
            ? new Date(createdAt.getTime() + 3 * 86_400_000)
            : null,
        createdAt,
      },
    });
    await prisma.complaintStatusHistory.upsert({
      where: { id: stableUuid(`complaint-history:${index}`) },
      update: { toStatus: status, actedByUserId: superadminId },
      create: {
        id: stableUuid(`complaint-history:${index}`),
        complaintId,
        toStatus: status,
        residentExplanation: 'Synthetic status history',
        actedByUserId: superadminId,
        createdAt,
      },
    });
  }
  const maintenanceStatuses = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'ASSIGNED',
    'VISIT_SCHEDULED',
    'WORK_IN_PROGRESS',
    'COMPLETED',
    'CLOSED',
  ] as const;
  for (let index = 0; index < 22; index += 1) {
    const resident =
      index < 3 ? residents[0] : residents[(index - 2) % residents.length];
    const status =
      index === 0
        ? 'ASSIGNED'
        : index === 1
          ? 'COMPLETED'
          : index === 2
            ? 'WORK_IN_PROGRESS'
            : maintenanceStatuses[index % maintenanceStatuses.length];
    const createdAt = monthDate(-(index % 12), 5 + (index % 18));
    const completed = ['COMPLETED', 'CLOSED'].includes(status);
    const requestId = stableUuid(`maintenance:${index}`);
    await prisma.maintenanceRequest.upsert({
      where: { id: requestId },
      update: {
        residentId: resident.id,
        unitId: resident.unitId,
        categoryId:
          maintenanceCategoryIds[index % maintenanceCategoryIds.length],
        status,
        priority:
          index % 11 === 0 ? 'EMERGENCY' : index % 4 === 0 ? 'HIGH' : 'NORMAL',
        createdAt,
      },
      create: {
        id: requestId,
        societyId,
        residentId: resident.id,
        unitId: resident.unitId,
        categoryId:
          maintenanceCategoryIds[index % maintenanceCategoryIds.length],
        ticketNumber: `MNT-DEMO-${String(index + 1).padStart(4, '0')}`,
        subject:
          index === 0
            ? 'Synthetic plumbing inspection'
            : index === 1
              ? 'Synthetic electrical repair'
              : index === 2
                ? 'Synthetic general maintenance'
                : `Synthetic maintenance scenario ${index + 1}`,
        description: 'Entirely fictional maintenance request for local review.',
        exactLocation: 'Synthetic residence area',
        preferredVisitDate: new Date(createdAt.getTime() + 2 * 86_400_000),
        preferredStartMinute: 600,
        preferredEndMinute: 720,
        accessInstructions: 'Use the fictional demo contact only.',
        residentUrgency: index % 4 === 0 ? 'HIGH' : 'NORMAL',
        priority:
          index % 11 === 0 ? 'EMERGENCY' : index % 4 === 0 ? 'HIGH' : 'NORMAL',
        preferredContactMethod: 'IN_APP',
        contactDisclosureConsent: false,
        status,
        propertySnapshot: { source: DEMO, unitId: resident.unitId },
        targetResponseAt: new Date(createdAt.getTime() + 4 * 3_600_000),
        targetResolutionAt: new Date(createdAt.getTime() + 5 * 86_400_000),
        respondedAt:
          status === 'SUBMITTED'
            ? null
            : new Date(createdAt.getTime() + 2 * 3_600_000),
        completedAt: completed
          ? new Date(createdAt.getTime() + 3 * 86_400_000)
          : null,
        closedAt:
          status === 'CLOSED'
            ? new Date(createdAt.getTime() + 4 * 86_400_000)
            : null,
        createdAt,
      },
    });
    await prisma.maintenanceStatusHistory.upsert({
      where: { id: stableUuid(`maintenance-history:${index}`) },
      update: { toStatus: status, actedByUserId: superadminId },
      create: {
        id: stableUuid(`maintenance-history:${index}`),
        maintenanceRequestId: requestId,
        toStatus: status,
        residentExplanation: 'Synthetic status history',
        actedByUserId: superadminId,
        createdAt,
      },
    });
    if (!['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(status)) {
      await prisma.workerAssignment.upsert({
        where: { id: stableUuid(`assignment:${index}`) },
        update: {
          workerId: workers[index % workers.length],
          status: completed ? 'COMPLETED' : 'ACTIVE',
        },
        create: {
          id: stableUuid(`assignment:${index}`),
          maintenanceRequestId: requestId,
          workerId: workers[index % workers.length],
          status: completed ? 'COMPLETED' : 'ACTIVE',
          reason: 'Synthetic skill and availability match',
          assignedByUserId: superadminId,
          assignedAt: new Date(createdAt.getTime() + 6 * 3_600_000),
          endedAt: completed
            ? new Date(createdAt.getTime() + 3 * 86_400_000)
            : null,
        },
      });
    }
  }
}

async function seedNotifications(
  societyId: string,
  superadminId: string,
  residents: DemoResident[],
) {
  const types = [
    'PAYMENT_DUE_REMINDER',
    'PAYMENT_RECEIPT_AVAILABLE',
    'MAINTENANCE_WORKER_ASSIGNED',
    'COMPLAINT_STATUS_UPDATED',
    'GENERAL_ANNOUNCEMENT',
    'EMERGENCY_ANNOUNCEMENT',
  ];
  const deliveryStatuses = [
    'DELIVERED',
    'ACCEPTED',
    'FAILED',
    'QUEUED',
  ] as const;
  for (let index = 0; index < 32; index += 1) {
    const resident =
      index < 8 ? residents[0] : residents[(index - 7) % residents.length];
    const type = types[index % types.length];
    const notificationId = stableUuid(`notification:${index}`);
    const createdAt = monthDate(-(index % 12), 6 + (index % 18));
    await prisma.notification.upsert({
      where: { id: notificationId },
      update: {
        notificationType: type,
        status: index % 9 === 0 ? 'PARTIALLY_SENT' : 'SENT',
        createdAt,
      },
      create: {
        id: notificationId,
        societyId,
        notificationType: type,
        priority: type === 'EMERGENCY_ANNOUNCEMENT' ? 'EMERGENCY' : 'NORMAL',
        subject: type.replaceAll('_', ' '),
        renderedContent: `Synthetic ${type.toLowerCase().replaceAll('_', ' ')} for local review.`,
        status: index % 9 === 0 ? 'PARTIALLY_SENT' : 'SENT',
        scheduledAt: createdAt,
        idempotencyKey: `${DEMO}:notification:${index}`,
        correlationId: `DEMO-${index + 1}`,
        createdByUserId: superadminId,
        createdAt,
      },
    });
    const recipientId = stableUuid(`notification-recipient:${index}`);
    const read = index % 3 === 0;
    await prisma.notificationRecipient.upsert({
      where: { id: recipientId },
      update: {
        notificationId,
        userId: resident.userId,
        residentId: resident.id,
        readStatus: read ? 'READ' : 'UNREAD',
        readAt: read ? new Date(createdAt.getTime() + 3_600_000) : null,
      },
      create: {
        id: recipientId,
        notificationId,
        userId: resident.userId,
        residentId: resident.id,
        readStatus: read ? 'READ' : 'UNREAD',
        readAt: read ? new Date(createdAt.getTime() + 3_600_000) : null,
        createdAt,
      },
    });
    for (const [channelIndex, channel] of (
      ['IN_APP', 'EMAIL', 'SMS'] as const
    ).entries()) {
      const status =
        channel === 'IN_APP'
          ? 'DELIVERED'
          : deliveryStatuses[(index + channelIndex) % deliveryStatuses.length];
      await prisma.notificationDelivery.upsert({
        where: { id: stableUuid(`delivery:${index}:${channelIndex}`) },
        update: {
          status,
          failureClassification: status === 'FAILED' ? 'TEMPORARY' : null,
          failureReason:
            status === 'FAILED' ? 'Synthetic sandbox provider failure' : null,
        },
        create: {
          id: stableUuid(`delivery:${index}:${channelIndex}`),
          recipientId,
          channel,
          destinationMasked:
            channel === 'EMAIL'
              ? 'd***@example.test'
              : channel === 'SMS'
                ? '+999******001'
                : null,
          status,
          retryCount: status === 'FAILED' ? 2 : 0,
          acceptedAt: ['ACCEPTED', 'DELIVERED'].includes(status)
            ? createdAt
            : null,
          deliveredAt: status === 'DELIVERED' ? createdAt : null,
          failureClassification: status === 'FAILED' ? 'TEMPORARY' : null,
          failureReason:
            status === 'FAILED' ? 'Synthetic sandbox provider failure' : null,
          idempotencyKey: `${DEMO}:delivery:${index}:${channelIndex}`,
          createdAt,
        },
      });
    }
  }
  for (let index = 0; index < 8; index += 1) {
    const announcementId = stableUuid(`announcement:${index}`);
    const publishAt = monthDate(-(index % 6), 4 + index);
    await prisma.announcement.upsert({
      where: { id: announcementId },
      update: { status: 'PUBLISHED', publishAt },
      create: {
        id: announcementId,
        societyId,
        subject:
          index === 0
            ? 'Synthetic emergency drill'
            : `Synthetic society announcement ${index + 1}`,
        message:
          'This is entirely fictional local demo information. No external delivery was attempted.',
        category: index === 0 ? 'Emergency' : 'General information',
        priority: index === 0 ? 'EMERGENCY' : 'NORMAL',
        status: 'PUBLISHED',
        channels: ['IN_APP', 'EMAIL', 'SMS'],
        publishAt,
        expiresAt: index < 2 ? monthEnd(1) : null,
        requiresAcknowledgment: index === 0,
        emergency: index === 0,
        createdByUserId: superadminId,
        createdAt: publishAt,
      },
    });
    await prisma.announcementAudience.upsert({
      where: { announcementId },
      update: { type: 'ALL_RESIDENTS', criteria: { source: DEMO } },
      create: {
        id: stableUuid(`announcement-audience:${index}`),
        announcementId,
        type: 'ALL_RESIDENTS',
        criteria: { source: DEMO },
        exclusions: [],
      },
    });
    for (const resident of residents) {
      await prisma.announcementAudienceSnapshot.upsert({
        where: {
          uk_announcement_snapshot_user: {
            announcementId,
            userId: resident.userId,
          },
        },
        update: { residentId: resident.id, channels: ['IN_APP'] },
        create: {
          id: stableUuid(`announcement-snapshot:${index}:${resident.id}`),
          announcementId,
          userId: resident.userId,
          residentId: resident.id,
          channels: ['IN_APP'],
        },
      });
    }
  }
}

async function seedPrimaryIdCard(resident: DemoResident) {
  const cardNumber = `${resident.number}-CARD-DEMO`;
  const objectKey = await writeDemoPdf(
    resident.id,
    'primary-id-card',
    'Residence.io Demo Resident ID Card',
    [
      'Residence.io Demo Society',
      'Avery Demo Resident',
      `Resident ID: ${resident.number}`,
      'Entirely synthetic development data',
    ],
  );
  await prisma.residentIDCard.upsert({
    where: { id: stableUuid('primary-id-card') },
    update: {
      cardNumber,
      pdfObjectKey: objectKey,
      status: 'ACTIVE',
      expiresAt: monthEnd(12),
    },
    create: {
      id: stableUuid('primary-id-card'),
      residentId: resident.id,
      cardNumber,
      verificationHash: digest(`${DEMO}:id-card`),
      pdfObjectKey: objectKey,
      status: 'ACTIVE',
      issuedAt: monthStart(0),
      expiresAt: monthEnd(12),
    },
  });
}

async function main() {
  const society = await prisma.society.findUnique({
    where: { slug: 'demo-residence' },
  });
  if (!society) {
    throw new Error(
      'Run the baseline development seed before the synthetic demo seed.',
    );
  }
  const superadmin = await prisma.userAccount.findUniqueOrThrow({
    where: { normalizedUsername: 'SUPERADMIN' },
  });
  const residentRole = await prisma.role.findUniqueOrThrow({
    where: {
      uk_role_society_code: { societyId: society.id, code: 'RESIDENT' },
    },
  });
  const passwordHash = await hash(
    process.env.RESIDENCE_SEED_PASSWORD as string,
    {
      type: 2,
      memoryCost: 19456,
      timeCost: 3,
      parallelism: 1,
    },
  );
  await prisma.society.update({
    where: { id: society.id },
    data: {
      name: 'Residence.io Demo Society',
      timeZone: 'Asia/Karachi',
      currency: CURRENCY,
    },
  });
  await prisma.userAccount.update({
    where: { id: superadmin.id },
    data: {
      passwordHash,
      status: 'ACTIVE',
      forcePasswordChange: false,
    },
  });
  currentStage = 'properties';
  const units = await seedProperties(society.id);
  currentStage = 'residents';
  const residents = await seedResidents(
    society.id,
    residentRole.id,
    passwordHash,
    units,
  );
  currentStage = 'finance';
  await seedFinance(society.id, superadmin.id, residents);
  currentStage = 'workforce';
  const workforce = await seedWorkforce(society.id, superadmin.id);
  currentStage = 'tickets';
  await seedTickets(
    society.id,
    superadmin.id,
    residents,
    workforce.workers,
    workforce.categoryIds,
    workforce.skillIds,
  );
  currentStage = 'notifications';
  await seedNotifications(society.id, superadmin.id, residents);
  currentStage = 'resident ID card';
  await seedPrimaryIdCard(residents[0]);
  process.stdout.write(
    'Synthetic demo seed complete: 60 units, 40 residents, 12 months of dues, 10 staff, 15 workers, 40 tickets, 32 notifications, and 8 announcements.\n',
  );
}

void main()
  .catch((error: unknown) => {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? ` (${error.code})`
        : '';
    const kind = error instanceof Error ? ` [${error.constructor.name}]` : '';
    const model =
      typeof error === 'object' &&
      error !== null &&
      'meta' in error &&
      typeof error.meta === 'object' &&
      error.meta !== null &&
      'modelName' in error.meta &&
      typeof error.meta.modelName === 'string'
        ? ` for ${error.meta.modelName}`
        : '';
    process.stderr.write(
      `Synthetic demo seed failed during ${currentStage}${model}${code}${kind}. Review local schema and constraints.\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
