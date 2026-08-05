import { Injectable } from '@nestjs/common';
import type { AuditOutcome, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEvent {
  societyId?: string;
  actorUserId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  outcome: AuditOutcome;
  reason?: string;
  correlationId?: string;
  sourceIp?: string;
  safeMetadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(event: AuditEvent) {
    return this.prisma.auditLog.create({ data: event });
  }

  async recordSafely(event: AuditEvent): Promise<void> {
    try {
      await this.record(event);
    } catch {
      // Never expand a failed audit event into logs because it may contain protected metadata.
    }
  }
}
