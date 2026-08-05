import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';

@Injectable()
export class WorkforceIdService {
  async nextStaff(
    tx: Prisma.TransactionClient,
    societyId: string,
    date = new Date(),
  ) {
    const year = date.getUTCFullYear();
    const rows = await tx.$queryRaw<Array<{ value: bigint }>>`
      INSERT INTO "staff_id_sequence" ("society_id","sequence_year","next_value","updated_at")
      VALUES (${societyId}::uuid,${year},2,CURRENT_TIMESTAMP)
      ON CONFLICT ("society_id","sequence_year") DO UPDATE SET
        "next_value"="staff_id_sequence"."next_value"+1,"updated_at"=CURRENT_TIMESTAMP
      RETURNING "next_value"-1 AS "value"`;
    const format = await this.format(
      tx,
      societyId,
      'staff.id.format',
      'STF-{YEAR}-{SEQUENCE}',
    );
    return this.render(format, year, rows[0].value);
  }

  async nextWorker(
    tx: Prisma.TransactionClient,
    societyId: string,
    categoryCode: string,
    date = new Date(),
  ) {
    const year = date.getUTCFullYear();
    const rows = await tx.$queryRaw<Array<{ value: bigint }>>`
      INSERT INTO "worker_id_sequence" ("society_id","category_code","sequence_year","next_value","updated_at")
      VALUES (${societyId}::uuid,${categoryCode},${year},2,CURRENT_TIMESTAMP)
      ON CONFLICT ("society_id","category_code","sequence_year") DO UPDATE SET
        "next_value"="worker_id_sequence"."next_value"+1,"updated_at"=CURRENT_TIMESTAMP
      RETURNING "next_value"-1 AS "value"`;
    const format = await this.format(
      tx,
      societyId,
      'worker.id.format',
      'WRK-{CATEGORY}-{YEAR}-{SEQUENCE}',
    );
    return this.render(
      format.replaceAll('{CATEGORY}', categoryCode),
      year,
      rows[0].value,
    );
  }

  private async format(
    tx: Prisma.TransactionClient,
    societyId: string,
    key: string,
    fallback: string,
  ) {
    const setting = await tx.systemSetting.findFirst({
      where: { societyId, settingKey: key, archivedAt: null },
      orderBy: { effectiveFrom: 'desc' },
      select: { settingValue: true },
    });
    return setting?.settingValue ?? fallback;
  }

  private render(format: string, year: number, value: bigint) {
    return format
      .replaceAll('{YEAR}', String(year))
      .replaceAll('{SEQUENCE}', value.toString().padStart(6, '0'));
  }
}
