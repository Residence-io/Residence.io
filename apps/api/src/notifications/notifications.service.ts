import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/request-context';
import {
  AnnouncementStatus,
  AuditOutcome,
  DeliveryStatus,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  Prisma,
  RecipientReadStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnnouncementDto,
  AnnouncementQueryDto,
  CallbackDto,
  ComposeDto,
  DeliveryQueryDto,
  PageDto,
  PreferenceDto,
  ReminderPreviewDto,
  TemplateDto,
  TemplatePreviewDto,
} from './dto/notification.dto';
import { TemplateRenderer } from './template-renderer';

const json = (value: unknown) => value as Prisma.InputJsonValue;
const page = (query: PageDto) => ({
  skip: (query.page - 1) * query.pageSize,
  take: query.pageSize,
});

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly renderer: TemplateRenderer,
    private readonly config: ConfigService,
  ) {}

  async templates(user: RequestUser, query: PageDto) {
    const where: Prisma.NotificationTemplateWhereInput = {
      societyId: user.societyId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              {
                notificationType: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificationTemplate.findMany({
        where,
        ...page(query),
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async publishTemplate(user: RequestUser, dto: TemplateDto) {
    this.renderer.validate(dto.messageTemplate, dto.allowedVariables);
    if (dto.subjectTemplate)
      this.renderer.validate(dto.subjectTemplate, dto.allowedVariables);
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.notificationTemplate.findUnique({
        where: {
          uk_template_society_name_channel_language: {
            societyId: user.societyId,
            name: dto.name,
            channel: dto.channel,
            language: dto.language,
          },
        },
      });
      const template = existing
        ? await tx.notificationTemplate.update({
            where: { id: existing.id },
            data: {
              notificationType: dto.notificationType,
              allowedVariables: json(dto.allowedVariables),
              active: true,
              publishedVersion: { increment: 1 },
              version: { increment: 1 },
            },
          })
        : await tx.notificationTemplate.create({
            data: {
              societyId: user.societyId,
              name: dto.name,
              notificationType: dto.notificationType,
              channel: dto.channel,
              language: dto.language,
              allowedVariables: json(dto.allowedVariables),
              publishedVersion: 1,
              createdByUserId: user.id,
            },
          });
      const versionNumber = existing ? existing.publishedVersion + 1 : 1;
      const version = await tx.notificationTemplateVersion.create({
        data: {
          templateId: template.id,
          versionNumber,
          subjectTemplate: dto.subjectTemplate,
          messageTemplate: dto.messageTemplate,
          allowedVariables: json(dto.allowedVariables),
          publishedByUserId: user.id,
        },
      });
      return { template, version };
    });
    await this.audit.recordSafely({
      societyId: user.societyId,
      actorUserId: user.id,
      action: 'NOTIFICATION_TEMPLATE_VERSIONED',
      targetType: 'NotificationTemplate',
      targetId: result.template.id,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: json({
        version: result.version.versionNumber,
        channel: dto.channel,
      }),
    });
    return result;
  }

  async template(user: RequestUser, id: string) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { id, societyId: user.societyId },
      include: { versions: { orderBy: { versionNumber: 'desc' } } },
    });
    if (!template) throw new NotFoundException('Template not found.');
    return template;
  }

  preview(dto: TemplatePreviewDto) {
    return {
      subject: dto.subject
        ? this.renderer.subject(dto.subject, dto.values, dto.allowedVariables)
        : '',
      message: this.renderer.render(
        dto.message,
        dto.values,
        dto.allowedVariables,
        dto.html,
      ),
      sample: true,
    };
  }

  async preferences(user: RequestUser) {
    return this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { societyId: user.societyId, userId: user.id },
    });
  }
  async updatePreferences(user: RequestUser, dto: PreferenceDto) {
    if (
      (dto.quietHoursStart === undefined) !==
      (dto.quietHoursEnd === undefined)
    )
      throw new BadRequestException('Both quiet-hour values are required.');
    const before = await this.preferences(user);
    const updated = await this.prisma.$transaction(async (tx) => {
      const value = await tx.notificationPreference.update({
        where: { userId: user.id },
        data: { ...dto, inAppEnabled: true, version: { increment: 1 } },
      });
      await tx.consentOrPreferenceHistory.create({
        data: {
          preferenceId: value.id,
          changedByUserId: user.id,
          changes: json({ before: { ...before, id: undefined }, after: dto }),
          policyBasis: 'Resident self-service preference change',
        },
      });
      return value;
    });
    await this.audit.recordSafely({
      societyId: user.societyId,
      actorUserId: user.id,
      action: 'NOTIFICATION_PREFERENCE_CHANGED',
      targetType: 'UserAccount',
      targetId: user.id,
      outcome: AuditOutcome.SUCCESS,
    });
    return updated;
  }

  async inbox(user: RequestUser, query: PageDto) {
    const where: Prisma.NotificationRecipientWhereInput = {
      userId: user.id,
      archivedAt: null,
      ...(query.search
        ? {
            notification: {
              OR: [
                { subject: { contains: query.search, mode: 'insensitive' } },
                {
                  renderedContent: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          }
        : {}),
    };
    const [items, total, unread] = await this.prisma.$transaction([
      this.prisma.notificationRecipient.findMany({
        where,
        ...page(query),
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        include: {
          notification: true,
          deliveries: { select: { channel: true, status: true } },
        },
      }),
      this.prisma.notificationRecipient.count({ where }),
      this.prisma.notificationRecipient.count({
        where: {
          userId: user.id,
          readStatus: RecipientReadStatus.UNREAD,
          archivedAt: null,
        },
      }),
    ]);
    return { items, total, unread, page: query.page, pageSize: query.pageSize };
  }
  async read(user: RequestUser, id: string) {
    const item = await this.prisma.notificationRecipient.findFirst({
      where: { id, userId: user.id },
      include: { notification: true },
    });
    if (!item) throw new NotFoundException('Notification not found.');
    return this.prisma.notificationRecipient.update({
      where: { id },
      data: {
        readStatus: RecipientReadStatus.READ,
        readAt: item.readAt ?? new Date(),
      },
      include: { notification: true },
    });
  }
  async readAll(user: RequestUser) {
    return this.prisma.notificationRecipient.updateMany({
      where: { userId: user.id, readStatus: RecipientReadStatus.UNREAD },
      data: { readStatus: RecipientReadStatus.READ, readAt: new Date() },
    });
  }
  async archive(user: RequestUser, id: string) {
    const item = await this.prisma.notificationRecipient.findFirst({
      where: { id, userId: user.id },
    });
    if (!item) throw new NotFoundException('Notification not found.');
    return this.prisma.notificationRecipient.update({
      where: { id },
      data: {
        readStatus: RecipientReadStatus.ARCHIVED,
        archivedAt: item.archivedAt ?? new Date(),
      },
    });
  }

  async compose(user: RequestUser, dto: ComposeDto) {
    const users = await this.prisma.userAccount.findMany({
      where: {
        id: { in: [...new Set(dto.userIds)] },
        societyId: user.societyId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        resident: { select: { id: true, primaryPhone: true } },
        notificationPreference: true,
      },
    });
    if (!users.length)
      throw new BadRequestException('No authorized recipients were selected.');
    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : new Date();
    const result = await this.prisma
      .$transaction(async (tx) => {
        const batch = await tx.notificationBatch.create({
          data: {
            societyId: user.societyId,
            name: dto.subject,
            kind: 'CUSTOM',
            status:
              scheduledAt > new Date()
                ? NotificationStatus.SCHEDULED
                : NotificationStatus.PROCESSING,
            criteria: json({ userIds: dto.userIds }),
            recipientSnapshot: json(users.map((item) => item.id)),
            estimatedCount: users.length,
            idempotencyKey: dto.idempotencyKey,
            createdByUserId: user.id,
          },
        });
        for (const account of users) {
          const notice = await tx.notification.create({
            data: {
              societyId: user.societyId,
              batchId: batch.id,
              notificationType: dto.notificationType,
              priority: dto.priority,
              subject: dto.subject,
              renderedContent: dto.message,
              scheduledAt,
              expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
              idempotencyKey: `${dto.idempotencyKey}:${account.id}`,
              createdByUserId: user.id,
            },
          });
          const recipient = await tx.notificationRecipient.create({
            data: {
              notificationId: notice.id,
              userId: account.id,
              residentId: account.resident?.id,
            },
          });
          for (const channel of [...new Set(dto.channels)]) {
            const destination =
              channel === NotificationChannel.EMAIL
                ? account.email
                : channel === NotificationChannel.SMS
                  ? account.resident?.primaryPhone
                  : undefined;
            const permitted =
              channel === NotificationChannel.IN_APP ||
              (channel === NotificationChannel.EMAIL
                ? account.notificationPreference?.emailEnabled !== false &&
                  Boolean(destination)
                : account.notificationPreference?.smsEnabled === true &&
                  Boolean(destination));
            await tx.notificationDelivery.create({
              data: {
                recipientId: recipient.id,
                channel,
                destinationMasked: destination ? this.mask(destination) : null,
                status: !permitted
                  ? DeliveryStatus.SKIPPED
                  : DeliveryStatus.QUEUED,
                failureReason: !permitted
                  ? 'Recipient preference or destination excluded this channel.'
                  : null,
                idempotencyKey: `${dto.idempotencyKey}:${account.id}:${channel}`,
              },
            });
          }
        }
        if (dto.scheduledAt)
          await tx.notificationSchedule.create({
            data: { batchId: batch.id, scheduledAt, timeZone: 'UTC' },
          });
        return batch;
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
          throw new ConflictException(
            'This notification batch was already confirmed.',
          );
        throw error;
      });
    await this.audit.recordSafely({
      societyId: user.societyId,
      actorUserId: user.id,
      action: dto.scheduledAt
        ? 'NOTIFICATION_SCHEDULED'
        : 'NOTIFICATION_BATCH_CONFIRMED',
      targetType: 'NotificationBatch',
      targetId: result.id,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: json({ recipients: users.length, channels: dto.channels }),
    });
    return result;
  }

  async reminderPreview(user: RequestUser, dto: ReminderPreviewDto) {
    const dues = await this.prisma.monthlyDue.findMany({
      where: {
        societyId: user.societyId,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        ...(dto.dueFrom || dto.dueTo
          ? {
              dueDate: {
                gte: dto.dueFrom ? new Date(dto.dueFrom) : undefined,
                lte: dto.dueTo ? new Date(dto.dueTo) : undefined,
              },
            }
          : {}),
      },
      include: {
        resident: {
          include: {
            user: { select: { id: true, email: true } },
            occupancies: {
              where: { endDate: null },
              include: { unit: { include: { property: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 5000,
    });
    const recipients = dues
      .map((due) => ({
        dueId: due.id,
        residentId: due.residentId,
        userId: due.resident.userId,
        residentName: due.resident.fullName,
        amount: due.totalAmount
          .minus(due.paidAmount)
          .minus(due.waivedAmount)
          .toString(),
        dueDate: due.dueDate,
        block: due.resident.occupancies[0]?.unit.property.block,
        unit: due.resident.occupancies[0]?.unit.unitNumber,
        missingEmail: !due.resident.user?.email,
        missingPhone: !due.resident.primaryPhone,
      }))
      .filter(
        (item) =>
          item.userId &&
          (!dto.block || item.block === dto.block) &&
          (!dto.unit || item.unit === dto.unit) &&
          Number(item.amount) >= (dto.minimumOutstanding ?? 0),
      );
    return {
      criteria: dto,
      estimatedRecipientCount: recipients.length,
      recipients: recipients.slice(0, 100),
      excludedCount: dues.length - recipients.length,
      recalculatedAt: new Date(),
    };
  }

  async announcements(user: RequestUser, query: AnnouncementQueryDto) {
    const where = {
      societyId: user.societyId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        ...page(query),
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        include: { audience: true, _count: { select: { snapshots: true } } },
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async createAnnouncement(user: RequestUser, dto: AnnouncementDto) {
    if (
      dto.emergency &&
      !user.permissions.includes('EMERGENCY_NOTIFICATION_SEND')
    )
      throw new ForbiddenException(
        'Emergency announcement permission is required.',
      );
    if (
      dto.expiresAt &&
      dto.publishAt &&
      new Date(dto.expiresAt) <= new Date(dto.publishAt)
    )
      throw new BadRequestException('Expiry must be after publication.');
    const targets = await this.resolveAudience(user, dto);
    if (!targets.length)
      throw new BadRequestException('Announcement audience is empty.');
    const result = await this.prisma.$transaction(async (tx) => {
      const scheduledAt = dto.publishAt ? new Date(dto.publishAt) : new Date();
      const announcement = await tx.announcement.create({
        data: {
          societyId: user.societyId,
          subject: dto.subject,
          message: dto.message,
          category: dto.category,
          priority: dto.emergency
            ? NotificationPriority.EMERGENCY
            : dto.priority,
          status:
            dto.publishAt && new Date(dto.publishAt) > new Date()
              ? AnnouncementStatus.SCHEDULED
              : AnnouncementStatus.PUBLISHED,
          channels: json(dto.channels),
          publishAt: dto.publishAt ? new Date(dto.publishAt) : new Date(),
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          requiresAcknowledgment: dto.requiresAcknowledgment,
          emergency: dto.emergency,
          createdByUserId: user.id,
          audience: {
            create: {
              type: dto.audienceType,
              criteria: json(dto.audienceCriteria),
              exclusions: json([]),
            },
          },
          snapshots: {
            create: targets.map((target) => ({
              userId: target.id,
              residentId: target.resident?.id,
              channels: json(dto.channels),
            })),
          },
        },
      });
      const batch = await tx.notificationBatch.create({
        data: {
          societyId: user.societyId,
          name: dto.subject,
          kind: dto.emergency ? 'EMERGENCY_ANNOUNCEMENT' : 'ANNOUNCEMENT',
          status:
            scheduledAt > new Date()
              ? NotificationStatus.SCHEDULED
              : NotificationStatus.PROCESSING,
          criteria: json({
            audienceType: dto.audienceType,
            criteria: dto.audienceCriteria,
          }),
          recipientSnapshot: json(targets.map((target) => target.id)),
          estimatedCount: targets.length,
          idempotencyKey: dto.idempotencyKey,
          createdByUserId: user.id,
        },
      });
      for (const target of targets) {
        const notice = await tx.notification.create({
          data: {
            societyId: user.societyId,
            batchId: batch.id,
            announcementId: announcement.id,
            notificationType: dto.emergency
              ? 'EMERGENCY_ANNOUNCEMENT'
              : 'GENERAL_ANNOUNCEMENT',
            priority: dto.emergency
              ? NotificationPriority.EMERGENCY
              : dto.priority,
            subject: dto.subject,
            renderedContent: dto.message,
            scheduledAt,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            idempotencyKey: `${dto.idempotencyKey}:${target.id}`,
            createdByUserId: user.id,
          },
        });
        const recipient = await tx.notificationRecipient.create({
          data: {
            notificationId: notice.id,
            userId: target.id,
            residentId: target.resident?.id,
          },
        });
        for (const channel of [...new Set(dto.channels)]) {
          const allowed =
            channel === NotificationChannel.IN_APP ||
            (channel === NotificationChannel.EMAIL
              ? target.notificationPreference?.emailEnabled !== false &&
                Boolean(target.email)
              : target.notificationPreference?.smsEnabled === true &&
                Boolean(target.resident?.primaryPhone));
          const destination =
            channel === NotificationChannel.EMAIL
              ? target.email
              : channel === NotificationChannel.SMS
                ? target.resident?.primaryPhone
                : undefined;
          await tx.notificationDelivery.create({
            data: {
              recipientId: recipient.id,
              channel,
              destinationMasked: destination ? this.mask(destination) : null,
              status: allowed ? DeliveryStatus.QUEUED : DeliveryStatus.SKIPPED,
              failureReason: allowed
                ? null
                : 'Recipient preference or destination excluded this channel.',
              idempotencyKey: `${dto.idempotencyKey}:${target.id}:${channel}`,
            },
          });
        }
      }
      if (scheduledAt > new Date())
        await tx.notificationSchedule.create({
          data: { batchId: batch.id, scheduledAt, timeZone: 'UTC' },
        });
      return announcement;
    });
    await this.audit.recordSafely({
      societyId: user.societyId,
      actorUserId: user.id,
      action: dto.emergency ? 'EMERGENCY_ALERT_SENT' : 'ANNOUNCEMENT_PUBLISHED',
      targetType: 'Announcement',
      targetId: result.id,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: json({
        recipientCount: targets.length,
        channels: dto.channels,
      }),
    });
    return { ...result, recipientCount: targets.length };
  }

  async deliveryLogs(user: RequestUser, query: DeliveryQueryDto) {
    const where: Prisma.NotificationDeliveryWhereInput = {
      recipient: {
        notification: { societyId: user.societyId },
        ...(query.search
          ? {
              user: {
                OR: [
                  { username: { contains: query.search, mode: 'insensitive' } },
                  { email: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      channel: query.channel,
      status: query.status,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificationDelivery.findMany({
        where,
        ...page(query),
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        include: {
          recipient: {
            select: {
              user: { select: { username: true, displayName: true } },
              notification: {
                select: { notificationType: true, subject: true },
              },
            },
          },
          attempts: { orderBy: { attemptNumber: 'desc' }, take: 1 },
        },
      }),
      this.prisma.notificationDelivery.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async batch(user: RequestUser, id: string) {
    const batch = await this.prisma.notificationBatch.findFirst({
      where: { id, societyId: user.societyId },
      include: {
        schedule: true,
        notifications: {
          select: {
            id: true,
            status: true,
            recipients: {
              select: {
                deliveries: { select: { channel: true, status: true } },
              },
            },
          },
        },
      },
    });
    if (!batch) throw new NotFoundException('Notification batch not found.');
    return batch;
  }
  async announcement(user: RequestUser, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, societyId: user.societyId },
      include: {
        audience: true,
        snapshots: { take: 100, orderBy: { createdAt: 'asc' } },
        attachments: { where: { archivedAt: null } },
      },
    });
    if (!announcement) throw new NotFoundException('Announcement not found.');
    return announcement;
  }
  async retry(user: RequestUser, id: string) {
    const delivery = await this.prisma.notificationDelivery.findFirst({
      where: { id, recipient: { notification: { societyId: user.societyId } } },
    });
    if (!delivery) throw new NotFoundException('Delivery not found.');
    if (
      delivery.status !== DeliveryStatus.FAILED &&
      delivery.status !== DeliveryStatus.RETRYING
    )
      throw new BadRequestException('This delivery is not eligible for retry.');
    const result = await this.prisma.notificationDelivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.QUEUED,
        nextAttemptAt: new Date(),
        failureReason: null,
      },
    });
    await this.audit.recordSafely({
      societyId: user.societyId,
      actorUserId: user.id,
      action: 'NOTIFICATION_DELIVERY_RETRIED',
      targetType: 'NotificationDelivery',
      targetId: id,
      outcome: AuditOutcome.SUCCESS,
    });
    return result;
  }
  async dashboard(user: RequestUser) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [sentToday, scheduled, failed, unread, recent] =
      await this.prisma.$transaction([
        this.prisma.notificationDelivery.count({
          where: {
            recipient: { notification: { societyId: user.societyId } },
            status: { in: [DeliveryStatus.ACCEPTED, DeliveryStatus.DELIVERED] },
            updatedAt: { gte: today },
          },
        }),
        this.prisma.notification.count({
          where: {
            societyId: user.societyId,
            status: NotificationStatus.SCHEDULED,
          },
        }),
        this.prisma.notificationDelivery.count({
          where: {
            recipient: { notification: { societyId: user.societyId } },
            status: DeliveryStatus.FAILED,
          },
        }),
        this.prisma.notificationRecipient.count({
          where: { userId: user.id, readStatus: RecipientReadStatus.UNREAD },
        }),
        this.prisma.announcement.findMany({
          where: {
            societyId: user.societyId,
            status: AnnouncementStatus.PUBLISHED,
          },
          orderBy: { publishAt: 'desc' },
          take: 5,
        }),
      ]);
    return {
      sentToday,
      scheduled,
      failed,
      unread,
      recentAnnouncements: recent,
    };
  }

  async callback(
    provider: string,
    rawBody: string,
    signature: string | undefined,
    dto: CallbackDto,
  ) {
    const secret = this.config.get<string>('notification.callbackSecret');
    if (!secret || !signature)
      throw new ForbiddenException('Callback authentication failed.');
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const supplied = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    if (
      supplied.length !== expectedBuffer.length ||
      !timingSafeEqual(supplied, expectedBuffer)
    )
      throw new ForbiddenException('Callback authentication failed.');
    const reference =
      await this.prisma.notificationProviderReference.findUnique({
        where: {
          uk_provider_reference: {
            provider,
            providerReference: dto.providerReference,
          },
        },
      });
    if (!reference)
      throw new NotFoundException('Provider reference not found.');
    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.providerCallbackEvent.findUnique({
        where: {
          uk_provider_callback: { provider, callbackId: dto.callbackId },
        },
      });
      if (duplicate) return duplicate;
      const event = await tx.providerCallbackEvent.create({
        data: {
          deliveryId: reference.deliveryId,
          provider,
          callbackId: dto.callbackId,
          providerReference: dto.providerReference,
          status: dto.status,
          payloadHash: createHash('sha256').update(rawBody).digest('hex'),
        },
      });
      await tx.notificationDelivery.update({
        where: { id: reference.deliveryId },
        data: {
          status: dto.status,
          deliveredAt:
            dto.status === DeliveryStatus.DELIVERED ? new Date() : undefined,
        },
      });
      return event;
    });
  }

  private mask(value: string) {
    const visible = value.slice(-4);
    return `${'*'.repeat(Math.max(4, value.length - 4))}${visible}`;
  }
  private async resolveAudience(user: RequestUser, dto: AnnouncementDto) {
    const ids = Array.isArray(dto.audienceCriteria.userIds)
      ? dto.audienceCriteria.userIds.filter(
          (id): id is string => typeof id === 'string',
        )
      : [];
    if (
      dto.audienceType === 'SELECTED_RESIDENTS' ||
      dto.audienceType === 'CUSTOM'
    )
      return this.prisma.userAccount.findMany({
        where: { societyId: user.societyId, status: 'ACTIVE', id: { in: ids } },
        select: {
          id: true,
          email: true,
          resident: { select: { id: true, primaryPhone: true } },
          notificationPreference: true,
        },
      });
    if (dto.audienceType === 'ADMINISTRATORS')
      return this.prisma.userAccount.findMany({
        where: {
          societyId: user.societyId,
          status: 'ACTIVE',
          roles: {
            some: {
              role: { code: { in: ['SUPER_ADMINISTRATOR', 'ADMINISTRATOR'] } },
            },
          },
        },
        select: {
          id: true,
          email: true,
          resident: { select: { id: true, primaryPhone: true } },
          notificationPreference: true,
        },
      });
    return this.prisma.userAccount.findMany({
      where: {
        societyId: user.societyId,
        status: 'ACTIVE',
        resident: { isNot: null },
      },
      select: {
        id: true,
        email: true,
        resident: { select: { id: true, primaryPhone: true } },
        notificationPreference: true,
      },
      take: 5000,
    });
  }
}
