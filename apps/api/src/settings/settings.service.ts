import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RequestUser } from '../common/request-context';
import { AllocationStrategy, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  FinancialSettingsDto,
  SettingsSection,
  SettingsSectionDto,
} from './dto/settings.dto';
import {
  assertSafeConfiguration,
  redactConfiguration,
} from './settings-policy';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSafe(actor: RequestUser) {
    const rows = await this.prisma.systemSetting.findMany({
      where: {
        societyId: actor.societyId,
        archivedAt: null,
        secretReference: null,
      },
      select: {
        id: true,
        settingKey: true,
        valueType: true,
        settingValue: true,
        effectiveFrom: true,
        version: true,
      },
      orderBy: { settingKey: 'asc' },
    });
    return rows.map((row) => ({
      ...row,
      settingValue:
        row.valueType === 'JSON' && row.settingValue
          ? JSON.stringify(
              redactConfiguration(JSON.parse(row.settingValue) as unknown),
            )
          : row.settingValue,
    }));
  }

  async getSection(actor: RequestUser, section: SettingsSection) {
    const row = await this.prisma.systemSetting.findFirst({
      where: {
        societyId: actor.societyId,
        settingKey: `phase7.${section}`,
        archivedAt: null,
        secretReference: null,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    return {
      section,
      data: row?.settingValue
        ? redactConfiguration(JSON.parse(row.settingValue) as unknown)
        : {},
      version: row?.version ?? 0,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  async updateSection(
    actor: RequestUser,
    section: SettingsSection,
    dto: SettingsSectionDto,
  ) {
    try {
      assertSafeConfiguration(dto.data);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    this.validateSection(section, dto.data);
    const now = new Date();
    const settingKey = `phase7.${section}`;
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.systemSetting.findFirst({
        where: { societyId: actor.societyId, settingKey, archivedAt: null },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (current && current.version !== dto.version)
        throw new ConflictException(
          'These settings were changed by another administrator. Reload and try again.',
        );
      if (current)
        await tx.systemSetting.update({
          where: { id: current.id },
          data: { archivedAt: now, version: { increment: 1 } },
        });
      const created = await tx.systemSetting.create({
        data: {
          societyId: actor.societyId,
          settingKey,
          valueType: 'JSON',
          settingValue: JSON.stringify(dto.data),
          effectiveFrom: now,
        },
      });
      if (section === 'society') {
        const societyData = dto.data;
        await tx.society.update({
          where: { id: actor.societyId },
          data: {
            name: String(societyData.name),
            timeZone: String(societyData.timeZone),
            currency: String(societyData.defaultCurrency).toUpperCase(),
            version: { increment: 1 },
          },
        });
      }
      await tx.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: 'SETTING_SECTION_CHANGED',
          targetType: 'SystemSetting',
          targetId: created.id,
          outcome: 'SUCCESS',
          safeMetadata: { section, previousVersion: current?.version ?? null },
        },
      });
      return {
        section,
        data: redactConfiguration(dto.data),
        version: created.version,
      };
    });
  }

  listFinancial(actor: RequestUser) {
    return this.prisma.financialSettingPeriod.findMany({
      where: { societyId: actor.societyId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async createFinancial(actor: RequestUser, dto: FinancialSettingsDto) {
    const from = new Date(dto.effectiveFrom);
    const to = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    const amount = new Prisma.Decimal(dto.defaultMonthlyFee);
    if (amount.isNegative())
      throw new BadRequestException(
        'The default monthly fee cannot be negative.',
      );
    if (to && to < from)
      throw new BadRequestException(
        'The effective end date must not precede the start date.',
      );
    if (!dto.supportedPaymentMethods.length)
      throw new BadRequestException(
        'Select at least one supported payment method.',
      );
    return this.prisma.$transaction(
      async (tx) => {
        const overlap = await tx.financialSettingPeriod.findFirst({
          where: {
            societyId: actor.societyId,
            archivedAt: null,
            effectiveFrom: { lte: to ?? new Date('9999-12-31') },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: from } }],
          },
        });
        if (overlap)
          throw new ConflictException(
            'An overlapping financial settings period already exists.',
          );
        const created = await tx.financialSettingPeriod.create({
          data: {
            societyId: actor.societyId,
            createdByUserId: actor.id,
            defaultMonthlyFee: amount,
            dueDay: dto.dueDay,
            gracePeriodDays: dto.gracePeriodDays,
            lateFeePolicy: dto.lateFeePolicy as Prisma.InputJsonValue,
            allocationStrategy: dto.allocationStrategy as AllocationStrategy,
            receiptPrefix: dto.receiptPrefix.trim().toUpperCase(),
            receiptSequenceStart: dto.receiptSequenceStart,
            paymentInstructions: dto.paymentInstructions?.trim(),
            supportedPaymentMethods: dto.supportedPaymentMethods,
            bankTransferInstructions: dto.bankTransferInstructions?.trim(),
            advancePaymentPolicy:
              dto.advancePaymentPolicy as Prisma.InputJsonValue,
            refundAndReversalPolicy:
              dto.refundAndReversalPolicy as Prisma.InputJsonValue,
            currency: dto.currency.toUpperCase(),
            roundingScale: dto.roundingScale,
            effectiveFrom: from,
            effectiveTo: to,
          },
        });
        await tx.auditLog.create({
          data: {
            societyId: actor.societyId,
            actorUserId: actor.id,
            action: 'FINANCIAL_SETTING_PERIOD_CREATED',
            targetType: 'FinancialSettingPeriod',
            targetId: created.id,
            outcome: 'SUCCESS',
            safeMetadata: {
              effectiveFrom: dto.effectiveFrom,
              effectiveTo: dto.effectiveTo ?? null,
              currency: created.currency,
            },
          },
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async archiveFinancial(actor: RequestUser, id: string, reason: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.financialSettingPeriod.updateMany({
        where: { id, societyId: actor.societyId, archivedAt: null },
        data: { archivedAt: new Date(), version: { increment: 1 } },
      });
      if (!updated.count)
        throw new NotFoundException('Financial settings period not found.');
      await tx.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: 'FINANCIAL_SETTING_PERIOD_ARCHIVED',
          targetType: 'FinancialSettingPeriod',
          targetId: id,
          outcome: 'SUCCESS',
          reason,
        },
      });
      return { archived: true };
    });
    return result;
  }

  private validateSection(
    section: SettingsSection,
    data: Record<string, unknown>,
  ) {
    if (section === 'society') {
      for (const field of ['name', 'timeZone', 'defaultCurrency'])
        if (typeof data[field] !== 'string' || !String(data[field]).trim())
          throw new BadRequestException(`${field} is required.`);
      if (!/^[A-Z]{3}$/i.test(String(data.defaultCurrency)))
        throw new BadRequestException(
          'Default currency must be a three-letter ISO code.',
        );
    }
    if (section === 'residents' && Number(data.maximumUploadSizeMb ?? 1) <= 0)
      throw new BadRequestException(
        'Maximum upload size must be greater than zero.',
      );
    if (section === 'notifications') {
      const retryLimit = Number(data.retryLimit ?? 0);
      if (!Number.isInteger(retryLimit) || retryLimit < 0 || retryLimit > 20)
        throw new BadRequestException('Retry limit must be between 0 and 20.');
    }
  }
}
