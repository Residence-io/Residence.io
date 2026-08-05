import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  DeliveryStatus,
  FailureClassification,
  NotificationChannel,
  NotificationStatus,
  OutboxStatus,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  SandboxEmailProvider,
  SandboxSmsProvider,
} from './providers/sandbox.providers';

export const retryDelayMs = (attempt: number, seed = 0) =>
  Math.min(3_600_000, 15_000 * 2 ** Math.max(0, attempt - 1)) + (seed % 5_000);

@Injectable()
export class NotificationProcessorService
  implements OnModuleInit, OnModuleDestroy
{
  private timer?: NodeJS.Timeout;
  private readonly workerId = `${process.pid}-${randomUUID()}`;
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: SandboxEmailProvider,
    private readonly sms: SandboxSmsProvider,
  ) {}

  onModuleInit() {
    if (this.config.get<string>('environment') !== 'test') {
      // Phase S7: skip local polling when Supabase Edge Function handles outbox
      const supabaseHandlesNotify =
        this.config?.get<boolean>('supabase.notifyEnabled', false) ?? false;
      if (!supabaseHandlesNotify) {
        this.timer = setInterval(
          () => void this.tick().catch(() => undefined),
          15_000,
        );
      } else {
        console.log(
          'Notification polling disabled — Supabase Edge Function handles outbox processing.',
        );
      }
      this.timer?.unref();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(limit = 50) {
    await this.ingestOutbox(Math.min(limit, 25));
    const claimed = await this.claim(limit);
    for (const id of claimed) await this.process(id);
    return { claimed: claimed.length };
  }

  async claim(limit: number): Promise<string[]> {
    return this.prisma.$transaction(
      async (tx) => {
        const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT d.id FROM notification_delivery d
        JOIN notification_recipient r ON r.id = d.recipient_id
        JOIN notification n ON n.id = r.notification_id
        WHERE d.status IN ('QUEUED','RETRYING')
          AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= now())
          AND (n.scheduled_at IS NULL OR n.scheduled_at <= now())
          AND (n.expires_at IS NULL OR n.expires_at > now())
          AND NOT EXISTS (SELECT 1 FROM notification_job_claim c WHERE c.delivery_id = d.id AND c.status = 'CLAIMED' AND c.lease_expires_at > now())
        ORDER BY d.created_at, d.id FOR UPDATE OF d SKIP LOCKED LIMIT ${limit}`);
        for (const row of rows) {
          await tx.notificationJobClaim.create({
            data: {
              deliveryId: row.id,
              workerId: this.workerId,
              leaseExpiresAt: new Date(Date.now() + 60_000),
            },
          });
          await tx.notificationDelivery.update({
            where: { id: row.id },
            data: {
              status: DeliveryStatus.PROCESSING,
              version: { increment: 1 },
            },
          });
        }
        return rows.map((row) => row.id);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async process(id: string): Promise<void> {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id },
      include: {
        recipient: {
          include: {
            notification: true,
            user: { include: { resident: true } },
          },
        },
      },
    });
    if (!delivery) return;
    const attempt = delivery.retryCount + 1;
    if (
      delivery.recipient.notification.expiresAt &&
      delivery.recipient.notification.expiresAt < new Date()
    ) {
      await this.finish(
        id,
        DeliveryStatus.EXPIRED,
        attempt,
        'Notification expired.',
        FailureClassification.PERMANENT,
      );
      return;
    }
    if (delivery.channel === NotificationChannel.IN_APP) {
      await this.finish(
        id,
        DeliveryStatus.DELIVERED,
        attempt,
        'Stored in application.',
        undefined,
      );
      return;
    }
    const provider =
      delivery.channel === NotificationChannel.EMAIL ? this.email : this.sms;
    const destination =
      delivery.channel === NotificationChannel.EMAIL
        ? delivery.recipient.user.email
        : delivery.recipient.user.resident?.primaryPhone;
    if (!destination) {
      await this.finish(
        id,
        DeliveryStatus.SKIPPED,
        attempt,
        'Recipient has no destination for this channel.',
        FailureClassification.INVALID_RECIPIENT,
      );
      return;
    }
    const result = await provider.send({
      destination,
      subject: delivery.recipient.notification.subject ?? undefined,
      content: delivery.recipient.notification.renderedContent,
      idempotencyKey: delivery.idempotencyKey,
    });
    const status = result.delivered
      ? DeliveryStatus.DELIVERED
      : result.accepted
        ? DeliveryStatus.ACCEPTED
        : DeliveryStatus.SKIPPED;
    await this.finish(
      id,
      status,
      attempt,
      result.safeResponse,
      result.failureClassification,
      result.providerReference,
      provider.name,
    );
  }

  private async finish(
    id: string,
    status: DeliveryStatus,
    attempt: number,
    response: string,
    classification?: FailureClassification,
    providerReference?: string,
    provider = 'in-app',
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryAttempt.create({
        data: {
          deliveryId: id,
          attemptNumber: attempt,
          provider,
          status,
          failureClassification: classification,
          safeResponse: response,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
      await tx.notificationDelivery.update({
        where: { id },
        data: {
          status,
          retryCount: attempt,
          acceptedAt:
            status === DeliveryStatus.ACCEPTED ? new Date() : undefined,
          deliveredAt:
            status === DeliveryStatus.DELIVERED ? new Date() : undefined,
          failureClassification: classification,
          failureReason:
            status === DeliveryStatus.FAILED ||
            status === DeliveryStatus.SKIPPED
              ? response
              : null,
          version: { increment: 1 },
        },
      });
      if (providerReference)
        await tx.notificationProviderReference.create({
          data: { deliveryId: id, provider, providerReference },
        });
      await tx.notificationJobClaim.updateMany({
        where: { deliveryId: id, workerId: this.workerId, status: 'CLAIMED' },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    });
  }

  private async ingestOutbox(limit: number) {
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: OutboxStatus.PENDING, availableAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    for (const event of events) {
      const payload =
        event.payload &&
        typeof event.payload === 'object' &&
        !Array.isArray(event.payload)
          ? (event.payload as Record<string, unknown>)
          : {};
      const societyId =
        typeof payload.societyId === 'string' ? payload.societyId : undefined;
      const userId =
        typeof payload.userId === 'string' ? payload.userId : undefined;
      const recipientAccount = await this.resolveEventRecipient(
        event.aggregateType,
        event.aggregateId,
        societyId,
        userId,
        typeof payload.residentId === 'string' ? payload.residentId : undefined,
      );
      if (!recipientAccount) continue;
      try {
        await this.prisma.$transaction(async (tx) => {
          const notice = await tx.notification.create({
            data: {
              societyId: recipientAccount.societyId,
              notificationType: event.eventType,
              subject: 'Residence.io update',
              renderedContent:
                'An update is available in your Residence.io account.',
              relatedType: event.aggregateType,
              relatedId: event.aggregateId,
              status: NotificationStatus.PROCESSING,
              idempotencyKey: `outbox:${event.id}`,
            },
          });
          const recipient = await tx.notificationRecipient.create({
            data: {
              notificationId: notice.id,
              userId: recipientAccount.userId,
              residentId: recipientAccount.residentId,
            },
          });
          await tx.notificationDelivery.create({
            data: {
              recipientId: recipient.id,
              channel: NotificationChannel.IN_APP,
              idempotencyKey: `outbox:${event.id}:in-app`,
            },
          });
          await tx.outboxEvent.update({
            where: { id: event.id },
            data: { status: OutboxStatus.PROCESSED, processedAt: new Date() },
          });
        });
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { status: OutboxStatus.PROCESSED, processedAt: new Date() },
          });
      }
    }
  }

  private async resolveEventRecipient(
    aggregateType: string,
    aggregateId: string,
    societyId?: string,
    userId?: string,
    residentId?: string,
  ) {
    if (userId) {
      const account = await this.prisma.userAccount.findUnique({
        where: { id: userId },
        select: { societyId: true, resident: { select: { id: true } } },
      });
      if (account)
        return {
          userId,
          societyId: societyId ?? account.societyId,
          residentId: account.resident?.id,
        };
    }
    if (residentId) {
      const resident = await this.prisma.resident.findUnique({
        where: { id: residentId },
        select: { societyId: true, userId: true },
      });
      if (resident?.userId)
        return {
          userId: resident.userId,
          societyId: resident.societyId,
          residentId,
        };
    }
    if (aggregateType === 'Payment') {
      const payment = await this.prisma.payment.findUnique({
        where: { id: aggregateId },
        select: {
          societyId: true,
          resident: { select: { id: true, userId: true } },
        },
      });
      if (payment?.resident.userId)
        return {
          userId: payment.resident.userId,
          societyId: payment.societyId,
          residentId: payment.resident.id,
        };
    }
    if (aggregateType === 'Complaint') {
      const ticket = await this.prisma.complaint.findUnique({
        where: { id: aggregateId },
        select: {
          societyId: true,
          resident: { select: { id: true, userId: true } },
        },
      });
      if (ticket?.resident.userId)
        return {
          userId: ticket.resident.userId,
          societyId: ticket.societyId,
          residentId: ticket.resident.id,
        };
    }
    if (aggregateType === 'MaintenanceRequest') {
      const ticket = await this.prisma.maintenanceRequest.findUnique({
        where: { id: aggregateId },
        select: {
          societyId: true,
          resident: { select: { id: true, userId: true } },
        },
      });
      if (ticket?.resident.userId)
        return {
          userId: ticket.resident.userId,
          societyId: ticket.societyId,
          residentId: ticket.resident.id,
        };
    }
    return undefined;
  }
}
