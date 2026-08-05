import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';

@Injectable()
export class TicketIdService {
  async next(
    tx: Prisma.TransactionClient,
    societyId: string,
    type: 'COMPLAINT' | 'MAINTENANCE',
  ) {
    const year = new Date().getUTCFullYear();
    const rows = await tx.$queryRaw<Array<{ value: bigint }>>`
      INSERT INTO "ticket_sequence"("society_id","ticket_type","sequence_year","next_value","updated_at")
      VALUES (${societyId}::uuid,${type}::"TicketType",${year},2,now())
      ON CONFLICT("society_id","ticket_type","sequence_year") DO UPDATE
      SET "next_value"="ticket_sequence"."next_value"+1,"updated_at"=now()
      RETURNING "next_value"-1 AS value`;
    const prefix = type === 'COMPLAINT' ? 'CMP' : 'MNT';
    return `${prefix}-${year}-${rows[0].value.toString().padStart(6, '0')}`;
  }
}
