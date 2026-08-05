import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';

@Injectable()
export class ResidentIdService {
  async next(
    transaction: Prisma.TransactionClient,
    societyId: string,
    date = new Date(),
  ): Promise<string> {
    const year = date.getUTCFullYear();
    const rows = await transaction.$queryRaw<Array<{ value: bigint }>>`
      INSERT INTO "resident_id_sequence" ("society_id", "sequence_year", "next_value", "updated_at")
      VALUES (${societyId}::uuid, ${year}, 2, CURRENT_TIMESTAMP)
      ON CONFLICT ("society_id", "sequence_year")
      DO UPDATE SET "next_value" = "resident_id_sequence"."next_value" + 1,
                    "updated_at" = CURRENT_TIMESTAMP
      RETURNING "next_value" - 1 AS "value"
    `;
    const setting = await transaction.systemSetting.findFirst({
      where: { societyId, settingKey: 'resident.id.format', archivedAt: null },
      orderBy: { effectiveFrom: 'desc' },
      select: { settingValue: true },
    });
    const format = setting?.settingValue ?? 'RES-{YEAR}-{SEQUENCE}';
    return format
      .replaceAll('{YEAR}', String(year))
      .replaceAll('{SEQUENCE}', String(rows[0].value).padStart(6, '0'));
  }
}
