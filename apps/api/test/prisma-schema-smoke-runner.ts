import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  const societyId = process.env.SCHEMA_SMOKE_SOCIETY_ID;
  if (!connectionString || !societyId) {
    throw new Error('Schema smoke test configuration is incomplete.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const feePlan = await prisma.feePlan.findFirst({ where: { societyId } });
    const resident = await prisma.resident.findFirst({
      where: { societyId },
      include: { householdMembers: true, vehicles: true },
    });

    if (!feePlan || !resident || resident.vehicles.length !== 1) {
      throw new Error('Representative Prisma records were not returned.');
    }
    if ((resident.vehicles[0] as any).societyId !== societyId) {
      throw new Error('Vehicle society ownership was not preserved.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
