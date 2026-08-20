/* eslint-disable @typescript-eslint/no-base-to-string */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RequestUser } from '../common/request-context';
import {
  Prisma,
  type AdjustmentType,
  type PaymentMethod,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';
import {
  allocateOldestFirst,
  calculateLateFee,
  dueStatus,
  money,
} from './financial-calculator';
import {
  AdjustmentDto,
  AssignFeePlanDto,
  CreateFeePlanDto,
  FinanceQueryDto,
  GenerateDuesDto,
  PaymentDto,
  PeriodDto,
  RefundDto,
  ResidentPaymentDto,
} from './dto/finance.dto';
import { DevelopmentPaymentProvider } from './payment-provider';
import { ReceiptService } from './receipt.service';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PrivateStorageService,
    private readonly provider: DevelopmentPaymentProvider,
    private readonly receipts: ReceiptService,
  ) {}
  async createFeePlan(actor: RequestUser, dto: CreateFeePlanDto) {
    const from = new Date(dto.effectiveFrom);
    const to = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (to && to < from)
      throw new BadRequestException(
        'Effective end must not precede the start date.',
      );
    const overlap = await this.prisma.feePlan.findFirst({
      where: {
        societyId: actor.societyId,
        scope: dto.scope,
        unitId: dto.unitId ?? null,
        propertyType: (dto.propertyType as any) ?? null,
        active: true,
        effectiveFrom: { lte: to ?? new Date('9999-12-31') },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: from } }],
      },
    });
    if (overlap)
      throw new ConflictException(
        'An overlapping active fee plan already exists for this scope.',
      );
    const plan = await this.prisma.feePlan.create({
      data: {
        societyId: actor.societyId,
        unitId: dto.unitId,
        propertyType: dto.propertyType as any,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        scope: dto.scope,
        monthlyBaseAmount: money(dto.monthlyBaseAmount),
        currency: dto.currency,
        effectiveFrom: from,
        effectiveTo: to,
        dueDay: dto.dueDay,
        gracePeriodDays: dto.gracePeriodDays,
        lateFeeType: dto.lateFeeType,
        lateFeeValue: money(dto.lateFeeValue),
        lateFeeRecurring: dto.lateFeeRecurring,
        createdByUserId: actor.id,
        lateFeeRule: {
          create: {
            type: dto.lateFeeType,
            value: money(dto.lateFeeValue),
            recurring: dto.lateFeeRecurring,
          },
        },
      },
    });
    await this.audit(actor, 'FEE_PLAN_CREATED', 'FeePlan', plan.id, {
      scope: plan.scope,
      currency: plan.currency,
    });
    return plan;
  }
  listFeePlans(actor: RequestUser) {
    return this.prisma.feePlan.findMany({
      where: { societyId: actor.societyId },
      orderBy: [{ active: 'desc' }, { effectiveFrom: 'desc' }],
    });
  }
  async assignFeePlan(actor: RequestUser, dto: AssignFeePlanDto) {
    const from = new Date(dto.effectiveFrom);
    const to = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (to && to < from)
      throw new BadRequestException(
        'Assignment end must not precede the start date.',
      );
    const [resident, plan, overlap] = await Promise.all([
      this.prisma.resident.findFirst({
        where: { id: dto.residentId, societyId: actor.societyId },
      }),
      this.prisma.feePlan.findFirst({
        where: { id: dto.feePlanId, societyId: actor.societyId, active: true },
      }),
      this.prisma.residentFeeAssignment.findFirst({
        where: {
          residentId: dto.residentId,
          effectiveFrom: { lte: to ?? new Date('9999-12-31') },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: from } }],
        },
      }),
    ]);
    if (!resident || !plan)
      throw new NotFoundException('Resident or fee plan not found.');
    if (overlap)
      throw new ConflictException(
        'An overlapping resident fee assignment already exists.',
      );
    const assignment = await this.prisma.residentFeeAssignment.create({
      data: {
        residentId: resident.id,
        feePlanId: plan.id,
        monthlyAmount: plan.monthlyBaseAmount,
        currency: plan.currency,
        effectiveFrom: from,
        effectiveTo: to,
        assignedByUserId: actor.id,
        reason: dto.reason.trim(),
      },
    });
    await this.audit(
      actor,
      'RESIDENT_FEE_ASSIGNED',
      'ResidentFeeAssignment',
      assignment.id,
      { residentId: resident.id, feePlanId: plan.id },
      dto.reason,
    );
    return assignment;
  }
  async deactivateFeePlan(actor: RequestUser, id: string, reason: string) {
    const plan = await this.prisma.feePlan.updateMany({
      where: { id, societyId: actor.societyId, active: true },
      data: { active: false, version: { increment: 1 } },
    });
    if (!plan.count) throw new NotFoundException('Fee plan not found.');
    await this.audit(actor, 'FEE_PLAN_DEACTIVATED', 'FeePlan', id, {}, reason);
  }
  async previewDues(actor: RequestUser, dto: PeriodDto) {
    const range = this.periodRange(dto.year, dto.month);
    const residents = await this.eligibleResidents(
      actor.societyId,
      range.start,
      range.end,
    );
    const rows = await Promise.all(
      residents.map(async (resident: any) => {
        const resolved = await this.resolveFee(
          actor.societyId,
          resident,
          range.start,
        );
        return {
          residentId: resident.id,
          residentNumber: resident.residentNumber,
          residentName: resident.fullName,
          amount: resolved?.amount.toFixed(2) ?? null,
          currency: resolved?.currency ?? null,
          source: resolved?.source ?? null,
          eligible: Boolean(resolved),
        };
      }),
    );
    return {
      period: dto,
      total: rows.length,
      eligible: rows.filter((x) => x.eligible).length,
      skipped: rows.filter((x) => !x.eligible).length,
      residents: rows,
    };
  }
  async generateDues(actor: RequestUser, dto: GenerateDuesDto) {
    const prior = await this.prisma.financialBatch.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (prior) return prior;
    const range = this.periodRange(dto.year, dto.month);
    return this.prisma.$transaction(
      async (tx) => {
        const period = await tx.billingPeriod.upsert({
          where: {
            uk_billing_period_society_month: {
              societyId: actor.societyId,
              year: dto.year,
              month: dto.month,
            },
          },
          create: {
            societyId: actor.societyId,
            year: dto.year,
            month: dto.month,
            startsAt: range.start,
            endsAt: range.end,
          },
          update: {},
        });
        const batch = await tx.financialBatch.create({
          data: {
            societyId: actor.societyId,
            billingPeriodId: period.id,
            idempotencyKey: dto.idempotencyKey,
            createdByUserId: actor.id,
          },
        });
        const residents = await this.eligibleResidents(
          actor.societyId,
          range.start,
          range.end,
          tx,
        );
        let generated = 0;
        let skipped = 0;
        for (const resident of residents) {
          if (
            await tx.monthlyDue.findUnique({
              where: {
                uk_due_resident_period: {
                  residentId: resident.id,
                  billingPeriodId: period.id,
                },
              },
            })
          ) {
            skipped++;
            continue;
          }
          const resolved = await this.resolveFee(
            actor.societyId,
            resident,
            range.start,
            tx,
          );
          if (!resolved) {
            skipped++;
            continue;
          }
          const dueDate = new Date(
            Date.UTC(dto.year, dto.month - 1, resolved.dueDay),
          );
          const grace = new Date(dueDate);
          grace.setUTCDate(grace.getUTCDate() + resolved.graceDays);
          const occupancy = resident.occupancies[0];
          const due = await tx.monthlyDue.create({
            data: {
              societyId: actor.societyId,
              residentId: resident.id,
              billingPeriodId: period.id,
              feePlanId: resolved.planId,
              financialBatchId: batch.id,
              currency: resolved.currency,
              principalAmount: resolved.amount,
              totalAmount: resolved.amount,
              dueDate,
              graceEndsAt: grace,
              feePlanSnapshot: {
                source: resolved.source,
                amount: resolved.amount.toFixed(2),
                planName: resolved.planName,
                dueDay: resolved.dueDay,
                graceDays: resolved.graceDays,
                lateFeeType: resolved.lateFeeType,
                lateFeeValue: resolved.lateFeeValue.toFixed(2),
              },
              unitSnapshot: occupancy
                ? {
                    unitId: occupancy.unitId,
                    unitNumber: occupancy.unit.unitNumber,
                    block: occupancy.unit.property.block,
                    propertyType: occupancy.unit.property.type,
                  }
                : {},
              lineItems: {
                create: {
                  type: 'PRINCIPAL',
                  description: `Monthly society fee for ${dto.year}-${String(dto.month).padStart(2, '0')}`,
                  amount: resolved.amount,
                  idempotencyKey: `due:${resident.id}:${dto.year}-${dto.month}:principal`,
                },
              },
              ledgerEntries: {
                create: {
                  societyId: actor.societyId,
                  residentId: resident.id,
                  type: 'MONTHLY_DUE',
                  direction: 'DEBIT',
                  amount: resolved.amount,
                  currency: resolved.currency,
                  eventDate: range.start,
                  reference: `DUE-${dto.year}-${dto.month}-${resident.residentNumber}`,
                  description: 'Monthly society fee',
                  idempotencyKey: `ledger:due:${resident.id}:${dto.year}-${dto.month}`,
                },
              },
            },
          });
          await tx.$queryRaw`SELECT "resident_id" FROM "resident_credit_balance" WHERE "resident_id" = ${resident.id}::uuid FOR UPDATE`;
          const credit = await tx.residentCreditBalance.findUnique({
            where: { residentId: resident.id },
          });
          if (
            credit &&
            credit.currency === resolved.currency &&
            credit.amount.gt(0)
          ) {
            const applied = money(
              Prisma.Decimal.min(credit.amount, resolved.amount),
            );
            await tx.residentCreditBalance.update({
              where: { residentId: resident.id },
              data: {
                amount: { decrement: applied },
                version: { increment: 1 },
              },
            });
            await tx.monthlyDue.update({
              where: { id: due.id },
              data: {
                paidAmount: applied,
                status: dueStatus(
                  due.totalAmount,
                  applied,
                  due.waivedAmount,
                  due.graceEndsAt,
                  new Date(),
                ) as any,
                version: { increment: 1 },
              },
            });
            await tx.financialLedgerEntry.create({
              data: {
                societyId: actor.societyId,
                residentId: resident.id,
                monthlyDueId: due.id,
                type: 'ADVANCE_APPLIED',
                direction: 'DEBIT',
                amount: applied,
                currency: resolved.currency,
                eventDate: range.start,
                reference: due.id,
                description: 'Advance credit applied to monthly due',
                idempotencyKey: `ledger:advance-applied:${due.id}`,
              },
            });
          }
          await tx.outboxEvent.create({
            data: {
              aggregateType: 'MonthlyDue',
              aggregateId: due.id,
              eventType: 'MONTHLY_DUE_CREATED',
              payload: {
                societyId: actor.societyId,
                residentId: resident.id,
                dueId: due.id,
                period: `${dto.year}-${String(dto.month).padStart(2, '0')}`,
              },
              deduplicationKey: `outbox:due:${due.id}`,
            },
          });
          generated++;
        }
        const completed = await tx.financialBatch.update({
          where: { id: batch.id },
          data: {
            status: 'COMPLETED',
            generatedCount: generated,
            skippedCount: skipped,
            completedAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            societyId: actor.societyId,
            actorUserId: actor.id,
            action: 'DUES_GENERATED',
            targetType: 'FinancialBatch',
            targetId: batch.id,
            outcome: 'SUCCESS',
            safeMetadata: {
              year: dto.year,
              month: dto.month,
              generated,
              skipped,
            },
          },
        });
        return completed;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 60_000,
      },
    );
  }
  async listDues(actor: RequestUser, query: FinanceQueryDto, own = false) {
    const residentId = own
      ? (await this.ownResident(actor)).id
      : query.residentId;
    const where: Prisma.MonthlyDueWhereInput = {
      societyId: actor.societyId,
      ...(residentId ? { residentId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.monthlyDue.findMany({
        where,
        include: {
          resident: { select: { residentNumber: true, fullName: true } },
          billingPeriod: true,
          lineItems: true,
        },
        orderBy: [{ dueDate: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.monthlyDue.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async recordPayment(
    actor: RequestUser,
    dto: PaymentDto | ResidentPaymentDto,
    residentId?: string,
  ) {
    const targetResidentId =
      residentId ??
      ('residentId' in dto
        ? dto.residentId
        : (await this.ownResident(actor)).id);
    const resident = await this.prisma.resident.findFirst({
      where: { id: targetResidentId, societyId: actor.societyId },
      include: { society: { select: { currency: true } } },
    });
    if (!resident) throw new NotFoundException('Resident not found.');
    if (dto.currency !== resident.society.currency)
      throw new BadRequestException(
        `Payments for this society must use ${resident.society.currency}.`,
      );
    const amount = money(dto.amount);
    if (amount.lte(0))
      throw new BadRequestException('Payment amount must be positive.');
    const status =
      dto.method === 'BANK_TRANSFER' ||
      dto.method === 'CARD_PROVIDER' ||
      dto.method === 'DIGITAL_WALLET'
        ? 'PENDING_VERIFICATION'
        : 'CONFIRMED';
    const payment = await this.prisma.payment.create({
      data: {
        societyId: actor.societyId,
        residentId: targetResidentId,
        amount,
        currency: dto.currency,
        method: dto.method as PaymentMethod,
        status,
        paymentDate:
          'paymentDate' in dto && dto.paymentDate
            ? new Date(dto.paymentDate)
            : new Date(),
        transactionReference:
          'transactionReference' in dto ? dto.transactionReference : undefined,
        idempotencyKey: dto.idempotencyKey,
        allocationStrategy: dto.allocationStrategy as any,
        allocationCriteria: dto.selectedDueIds?.length
          ? { selectedDueIds: dto.selectedDueIds }
          : undefined,
        notes: 'notes' in dto ? dto.notes : undefined,
        recordedByUserId: actor.id,
      },
    });
    await this.audit(actor, 'PAYMENT_RECORDED', 'Payment', payment.id, {
      status,
      method: payment.method,
      currency: payment.currency,
    });
    if (status === 'CONFIRMED')
      return this.confirmPayment(actor, payment.id, dto.selectedDueIds);
    if (dto.method === 'CARD_PROVIDER' || dto.method === 'DIGITAL_WALLET') {
      const intent = await this.provider.createIntent({
        internalReference: payment.id,
        amount: amount.toFixed(2),
        currency: dto.currency,
        idempotencyKey: dto.idempotencyKey,
      });
      await this.prisma.paymentProviderTransaction.create({
        data: {
          paymentId: payment.id,
          provider: 'DEVELOPMENT_SANDBOX',
          providerReference: intent.providerReference,
          status: intent.status,
          amount,
          currency: dto.currency,
          idempotencyKey: `provider:${dto.idempotencyKey}`,
        },
      });
    }
    return payment;
  }
  async storeProof(
    actor: RequestUser,
    paymentId: string,
    file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Payment proof is required.');
    const payment = await this.ownedPayment(actor, paymentId);
    if (
      payment.method !== 'BANK_TRANSFER' ||
      payment.status !== 'PENDING_VERIFICATION'
    )
      throw new BadRequestException(
        'Only pending bank transfers accept proof.',
      );
    const stored = await this.storage.store(
      payment.residentId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    try {
      const proof = await this.prisma.paymentProof.create({
        data: { paymentId, ...stored, sizeBytes: BigInt(stored.sizeBytes) },
      });
      await this.audit(
        actor,
        'PAYMENT_PROOF_UPLOADED',
        'PaymentProof',
        proof.id,
        { paymentId },
      );
      return proof;
    } catch (error) {
      await this.storage.remove(stored.objectKey);
      throw error;
    }
  }
  async processProviderCallback(
    rawBody: Buffer | undefined,
    signature: string,
  ) {
    if (!rawBody || !this.provider.verifyCallback(rawBody, signature))
      throw new ForbiddenException('Invalid provider callback signature.');
    let event: {
      eventId: string;
      providerReference: string;
      paymentId: string;
      status: 'CONFIRMED' | 'FAILED';
      amount: string;
      currency: string;
    };
    try {
      event = JSON.parse(rawBody.toString('utf8')) as typeof event;
    } catch {
      throw new BadRequestException('Invalid provider callback payload.');
    }
    if (
      !event.eventId ||
      !event.providerReference ||
      !event.paymentId ||
      !['CONFIRMED', 'FAILED'].includes(event.status) ||
      !/^\d{1,16}(\.\d{1,2})?$/.test(event.amount) ||
      !/^[A-Z]{3}$/.test(event.currency)
    )
      throw new BadRequestException('Invalid provider callback payload.');
    const transaction = await this.prisma.paymentProviderTransaction.findFirst({
      where: {
        provider: 'DEVELOPMENT_SANDBOX',
        providerReference: event.providerReference,
      },
      include: { payment: true },
    });
    if (
      !transaction ||
      transaction.paymentId !== event.paymentId ||
      !transaction.amount.equals(money(event.amount)) ||
      transaction.currency !== event.currency
    )
      throw new BadRequestException(
        'Provider callback does not match the internal payment.',
      );
    if (
      transaction.providerEventId &&
      transaction.providerEventId !== event.eventId
    )
      throw new ConflictException('Provider transaction is already finalized.');
    if (!transaction.providerEventId) {
      await this.prisma.paymentProviderTransaction.update({
        where: { id: transaction.id },
        data: {
          providerEventId: event.eventId,
          status: event.status,
          safeResponse: { eventId: event.eventId, status: event.status },
        },
      });
    }
    if (event.status === 'FAILED') {
      await this.prisma.payment.updateMany({
        where: { id: transaction.paymentId, status: 'PENDING_VERIFICATION' },
        data: { status: 'FAILED', version: { increment: 1 } },
      });
      return { accepted: true, status: 'FAILED' };
    }
    if (!transaction.payment.recordedByUserId)
      throw new ConflictException('Payment callback has no accountable user.');
    const actor: RequestUser = {
      id: transaction.payment.recordedByUserId,
      societyId: transaction.payment.societyId,
      username: 'payment-provider',
      displayName: 'Payment provider callback',
      forcePasswordChange: false,
      roles: [],
      permissions: [],
      csrfToken: '',
      sessionId: '',
    };
    await this.confirmPayment(actor, transaction.paymentId);
    return { accepted: true, status: 'CONFIRMED' };
  }
  async downloadProof(actor: RequestUser, paymentId: string, proofId: string) {
    const payment = await this.ownedPayment(actor, paymentId);
    const proof = await this.prisma.paymentProof.findFirst({
      where: { id: proofId, paymentId: payment.id },
    });
    if (!proof) throw new NotFoundException('Payment proof not found.');
    await this.audit(
      actor,
      'PAYMENT_PROOF_DOWNLOADED',
      'PaymentProof',
      proof.id,
      {
        paymentId,
      },
    );
    return {
      buffer: await this.storage.read(proof.objectKey),
      mediaType: proof.mediaType,
      fileName: proof.originalFileName,
    };
  }
  async verifyPayment(
    actor: RequestUser,
    paymentId: string,
    selectedDueIds?: string[],
  ) {
    return this.confirmPayment(actor, paymentId, selectedDueIds);
  }
  async rejectPayment(actor: RequestUser, paymentId: string, reason: string) {
    const result = await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        societyId: actor.societyId,
        status: 'PENDING_VERIFICATION',
      },
      data: { status: 'FAILED', version: { increment: 1 } },
    });
    if (!result.count)
      throw new NotFoundException('Pending payment not found.');
    await this.prisma.paymentProof.updateMany({
      where: { paymentId, reviewedAt: null },
      data: {
        reviewedAt: new Date(),
        reviewedByUserId: actor.id,
        rejectionReason: reason,
      },
    });
    await this.audit(
      actor,
      'PAYMENT_PROOF_REJECTED',
      'Payment',
      paymentId,
      {},
      reason,
    );
  }
  async adjustDue(actor: RequestUser, dueId: string, dto: AdjustmentDto) {
    const due = await this.prisma.monthlyDue.findFirst({
      where: { id: dueId, societyId: actor.societyId },
    });
    if (!due) throw new NotFoundException('Due not found.');
    const amount =
      dto.type === 'PERCENTAGE_DISCOUNT'
        ? money(due.principalAmount.mul(dto.amount).div(100))
        : dto.type === 'FULL_WAIVER'
          ? money(due.totalAmount.sub(due.paidAmount).sub(due.waivedAmount))
          : money(dto.amount);
    if (amount.lte(0))
      throw new BadRequestException('Adjustment amount must be positive.');
    const credit = [
      'FIXED_DISCOUNT',
      'PERCENTAGE_DISCOUNT',
      'PARTIAL_WAIVER',
      'FULL_WAIVER',
      'CREDIT_ADJUSTMENT',
    ].includes(dto.type);
    await this.prisma.$transaction(async (tx) => {
      if (credit) {
        await tx.discountOrWaiver.create({
          data: {
            monthlyDueId: due.id,
            type: dto.type as AdjustmentType,
            amount,
            currency: due.currency,
            reason: dto.reason,
            actedByUserId: actor.id,
            idempotencyKey: dto.idempotencyKey,
          },
        });
        await tx.monthlyDue.update({
          where: { id: due.id },
          data: {
            waivedAmount: { increment: amount },
            status: dueStatus(
              due.totalAmount,
              due.paidAmount,
              due.waivedAmount.add(amount),
              due.graceEndsAt,
              new Date(),
            ) as any,
            version: { increment: 1 },
          },
        });
      } else {
        await tx.paymentAdjustment.create({
          data: {
            monthlyDueId: due.id,
            type: dto.type as AdjustmentType,
            amount,
            currency: due.currency,
            reason: dto.reason,
            actedByUserId: actor.id,
            idempotencyKey: dto.idempotencyKey,
          },
        });
        await tx.monthlyDue.update({
          where: { id: due.id },
          data: {
            totalAmount: { increment: amount },
            version: { increment: 1 },
          },
        });
      }
      await tx.financialLedgerEntry.create({
        data: {
          societyId: actor.societyId,
          residentId: due.residentId,
          monthlyDueId: due.id,
          type: credit
            ? dto.type.includes('WAIVER')
              ? 'WAIVER'
              : 'DISCOUNT'
            : 'DEBIT_ADJUSTMENT',
          direction: credit ? 'CREDIT' : 'DEBIT',
          amount,
          currency: due.currency,
          eventDate: new Date(),
          reference: `ADJ-${dto.idempotencyKey}`,
          description: dto.reason,
          idempotencyKey: `ledger:${dto.idempotencyKey}`,
        },
      });
      await tx.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: credit ? 'DISCOUNT_OR_WAIVER_APPLIED' : 'ADJUSTMENT_POSTED',
          targetType: 'MonthlyDue',
          targetId: due.id,
          outcome: 'SUCCESS',
          reason: dto.reason,
          safeMetadata: { type: dto.type, currency: due.currency },
        },
      });
    });
  }
  async applyLateFees(actor: RequestUser) {
    const now = new Date();
    const dues = await this.prisma.monthlyDue.findMany({
      where: {
        societyId: actor.societyId,
        graceEndsAt: { lt: now },
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
    });
    let applied = 0;
    for (const due of dues) {
      const snapshot = due.feePlanSnapshot as any;
      const amount = calculateLateFee(
        due.principalAmount,
        snapshot.lateFeeType ?? 'NONE',
        snapshot.lateFeeValue ?? '0',
      );
      if (amount.lte(0)) continue;
      const key = `late:${due.id}:1`;
      try {
        await this.prisma.$transaction([
          this.prisma.dueLineItem.create({
            data: {
              monthlyDueId: due.id,
              type: 'LATE_FEE',
              description: 'Late fee',
              amount,
              calculationSnapshot: {
                type: snapshot.lateFeeType,
                value: snapshot.lateFeeValue,
              },
              idempotencyKey: key,
            },
          }),
          this.prisma.monthlyDue.update({
            where: { id: due.id },
            data: {
              totalAmount: { increment: amount },
              status: 'OVERDUE',
              version: { increment: 1 },
            },
          }),
          this.prisma.financialLedgerEntry.create({
            data: {
              societyId: actor.societyId,
              residentId: due.residentId,
              monthlyDueId: due.id,
              type: 'LATE_FEE',
              direction: 'DEBIT',
              amount,
              currency: due.currency,
              eventDate: now,
              reference: key,
              description: 'Late fee',
              idempotencyKey: `ledger:${key}`,
            },
          }),
        ]);
        applied++;
      } catch (error) {
        if (!(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ))
          throw error;
      }
    }
    await this.audit(actor, 'LATE_FEES_APPLIED', 'Society', actor.societyId, {
      applied,
    });
    return { applied };
  }
  async ledger(
    actor: RequestUser,
    residentId?: string,
    query: FinanceQueryDto = new FinanceQueryDto(),
  ) {
    const id = residentId ?? (await this.ownResident(actor)).id;
    await this.assertResidentAccess(actor, id);
    const where = { societyId: actor.societyId, residentId: id };
    const [items, total, aggregate, credit] = await this.prisma.$transaction([
      this.prisma.financialLedgerEntry.findMany({
        where,
        orderBy: [{ eventDate: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.financialLedgerEntry.count({ where }),
      this.prisma.financialLedgerEntry.groupBy({
        by: ['direction'],
        where,
        orderBy: { direction: 'asc' },
        _sum: { amount: true },
      }),
      this.prisma.residentCreditBalance.findUnique({
        where: { residentId: id },
      }),
    ]);
    const aggregateRows = aggregate ?? [];
    const debit =
      aggregateRows.find((x) => x.direction === 'DEBIT')?._sum?.amount ??
      money(0);
    const credits =
      aggregateRows.find((x) => x.direction === 'CREDIT')?._sum?.amount ??
      money(0);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      balance: money(debit.sub(credits)).toFixed(2),
      advanceCredit: credit?.amount.toFixed(2) ?? '0.00',
    };
  }
  async payment(actor: RequestUser, id: string) {
    const payment = await this.ownedPayment(actor, id);
    return this.prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        resident: true,
        allocations: {
          include: { monthlyDue: { include: { billingPeriod: true } } },
        },
        proofs: true,
        receipt: true,
        refunds: true,
        reversal: true,
      },
    });
  }
  async listPayments(actor: RequestUser, query: FinanceQueryDto) {
    const where: Prisma.PaymentWhereInput = {
      societyId: actor.societyId,
      ...(query.residentId ? { residentId: query.residentId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              {
                transactionReference: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                resident: {
                  residentNumber: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                resident: {
                  normalizedFullName: { contains: query.search.toLowerCase() },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: {
          resident: {
            select: { id: true, residentNumber: true, fullName: true },
          },
          receipt: true,
        },
        orderBy: [{ paymentDate: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async reverse(
    actor: RequestUser,
    paymentId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, societyId: actor.societyId, status: 'CONFIRMED' },
      include: { allocations: true },
    });
    if (!payment) throw new NotFoundException('Confirmed payment not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentReversal.create({
        data: {
          paymentId,
          amount: payment.amount,
          reason,
          actedByUserId: actor.id,
          idempotencyKey,
        },
      });
      for (const allocation of payment.allocations) {
        const due = await tx.monthlyDue.findUniqueOrThrow({
          where: { id: allocation.monthlyDueId },
        });
        const paid = money(due.paidAmount.sub(allocation.amount));
        await tx.monthlyDue.update({
          where: { id: due.id },
          data: {
            paidAmount: paid,
            status: dueStatus(
              due.totalAmount,
              paid,
              due.waivedAmount,
              due.graceEndsAt,
              new Date(),
            ) as any,
            version: { increment: 1 },
          },
        });
      }
      const allocated = payment.allocations.reduce(
        (sum, allocation) => sum.add(allocation.amount),
        money(0),
      );
      const advance = money(payment.amount.sub(allocated));
      if (advance.gt(0)) {
        const credit = await tx.residentCreditBalance.findUnique({
          where: { residentId: payment.residentId },
        });
        if (!credit || credit.amount.lt(advance))
          throw new ConflictException(
            'This payment advance has already been applied and cannot be reversed directly.',
          );
        await tx.residentCreditBalance.update({
          where: { residentId: payment.residentId },
          data: {
            amount: { decrement: advance },
            version: { increment: 1 },
          },
        });
      }
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.financialLedgerEntry.create({
        data: {
          societyId: actor.societyId,
          residentId: payment.residentId,
          paymentId,
          type: 'REVERSAL',
          direction: 'DEBIT',
          amount: payment.amount,
          currency: payment.currency,
          eventDate: new Date(),
          reference: `REV-${payment.id}`,
          description: reason,
          idempotencyKey: `ledger:${idempotencyKey}`,
        },
      });
      await tx.receipt.updateMany({
        where: { paymentId },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: 'PAYMENT_REVERSED',
          targetType: 'Payment',
          targetId: payment.id,
          outcome: 'SUCCESS',
          reason,
          safeMetadata: { currency: payment.currency },
        },
      });
    });
  }
  async refund(actor: RequestUser, paymentId: string, dto: RefundDto) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        societyId: actor.societyId,
        status: { in: ['CONFIRMED', 'PARTIALLY_REFUNDED'] },
      },
      include: { refunds: true, allocations: true },
    });
    if (!payment) throw new NotFoundException('Refundable payment not found.');
    const amount = money(dto.amount);
    const prior = payment.refunds.reduce(
      (sum, item) => sum.add(item.amount),
      money(0),
    );
    if (amount.lte(0) || prior.add(amount).gt(payment.amount))
      throw new BadRequestException('Refund exceeds the refundable amount.');
    const total = prior.add(amount);
    await this.prisma.$transaction(async (tx) => {
      const allocated = payment.allocations.reduce(
        (sum, allocation) => sum.add(allocation.amount),
        money(0),
      );
      const originalAdvance = money(payment.amount.sub(allocated));
      const priorAdvanceRefunded = Prisma.Decimal.min(prior, originalAdvance);
      const totalAdvanceRefunded = Prisma.Decimal.min(total, originalAdvance);
      const advanceDelta = money(
        totalAdvanceRefunded.sub(priorAdvanceRefunded),
      );
      if (advanceDelta.gt(0)) {
        const credit = await tx.residentCreditBalance.findUnique({
          where: { residentId: payment.residentId },
        });
        if (!credit || credit.amount.lt(advanceDelta))
          throw new ConflictException(
            'The advance portion has already been applied and cannot be refunded directly.',
          );
        await tx.residentCreditBalance.update({
          where: { residentId: payment.residentId },
          data: {
            amount: { decrement: advanceDelta },
            version: { increment: 1 },
          },
        });
      }
      const priorAllocatedRefund = Prisma.Decimal.max(
        prior.sub(originalAdvance),
        0,
      );
      const totalAllocatedRefund = Prisma.Decimal.max(
        total.sub(originalAdvance),
        0,
      );
      let offset = money(0);
      for (const allocation of [...payment.allocations].reverse()) {
        const priorForAllocation = Prisma.Decimal.min(
          Prisma.Decimal.max(priorAllocatedRefund.sub(offset), 0),
          allocation.amount,
        );
        const totalForAllocation = Prisma.Decimal.min(
          Prisma.Decimal.max(totalAllocatedRefund.sub(offset), 0),
          allocation.amount,
        );
        const delta = money(totalForAllocation.sub(priorForAllocation));
        if (delta.gt(0)) {
          const due = await tx.monthlyDue.findUniqueOrThrow({
            where: { id: allocation.monthlyDueId },
          });
          const paid = money(due.paidAmount.sub(delta));
          await tx.monthlyDue.update({
            where: { id: due.id },
            data: {
              paidAmount: paid,
              status: dueStatus(
                due.totalAmount,
                paid,
                due.waivedAmount,
                due.graceEndsAt,
                new Date(),
              ) as any,
              version: { increment: 1 },
            },
          });
        }
        offset = money(offset.add(allocation.amount));
      }
      await tx.refund.create({
        data: {
          paymentId,
          amount,
          currency: payment.currency,
          reason: dto.reason,
          actedByUserId: actor.id,
          idempotencyKey: dto.idempotencyKey,
        },
      });
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: total.eq(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          version: { increment: 1 },
        },
      });
      await tx.financialLedgerEntry.create({
        data: {
          societyId: actor.societyId,
          residentId: payment.residentId,
          paymentId,
          type: 'REFUND',
          direction: 'DEBIT',
          amount,
          currency: payment.currency,
          eventDate: new Date(),
          reference: `REFUND-${dto.idempotencyKey}`,
          description: dto.reason,
          idempotencyKey: `ledger:${dto.idempotencyKey}`,
        },
      });
      await tx.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: 'PAYMENT_REFUNDED',
          targetType: 'Payment',
          targetId: payment.id,
          outcome: 'SUCCESS',
          reason: dto.reason,
          safeMetadata: { currency: payment.currency },
        },
      });
    });
  }
  async dashboard(actor: RequestUser, own = false) {
    const residentId = own ? (await this.ownResident(actor)).id : undefined;
    const dueWhere = {
      societyId: actor.societyId,
      ...(residentId ? { residentId } : {}),
    };
    const paymentWhere = {
      societyId: actor.societyId,
      ...(residentId ? { residentId } : {}),
      status: 'CONFIRMED' as const,
    };
    const [dues, payments, pendingVerification] =
      await this.prisma.$transaction([
        this.prisma.monthlyDue.findMany({
          where: dueWhere,
          select: {
            totalAmount: true,
            paidAmount: true,
            waivedAmount: true,
            status: true,
            dueDate: true,
            currency: true,
          },
        }),
        this.prisma.payment.aggregate({
          where: paymentWhere,
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.payment.count({
          where: {
            societyId: actor.societyId,
            status: 'PENDING_VERIFICATION',
            ...(residentId ? { residentId } : {}),
          },
        }),
      ]);
    const outstanding = dues.reduce(
      (sum, due) =>
        sum.add(due.totalAmount).sub(due.paidAmount).sub(due.waivedAmount),
      money(0),
    );
    return {
      currency: dues[0]?.currency ?? 'PKR',
      totalReceived: payments._sum.amount?.toFixed(2) ?? '0.00',
      confirmedPayments: payments._count,
      pendingVerification,
      pendingDues: dues.filter((d) =>
        ['PENDING', 'PARTIALLY_PAID'].includes(d.status),
      ).length,
      overdueDues: dues.filter((d) => d.status === 'OVERDUE').length,
      outstanding: outstanding.toFixed(2),
      nextDueDate:
        dues
          .filter((d) =>
            d.totalAmount.sub(d.paidAmount).sub(d.waivedAmount).gt(0),
          )
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]
          ?.dueDate ?? null,
    };
  }
  async exportCsv(actor: RequestUser) {
    const payments = await this.prisma.payment.findMany({
      where: { societyId: actor.societyId },
      include: {
        resident: { select: { residentNumber: true, fullName: true } },
        receipt: { select: { receiptNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: 10_000,
    });
    await this.audit(
      actor,
      'FINANCIAL_EXPORT_GENERATED',
      'Society',
      actor.societyId,
      { rowCount: payments.length },
    );
    const escape = (value: unknown) =>
      `"${String(value ?? '').replaceAll('"', '""')}"`;
    return [
      'payment_id,resident_number,resident_name,date,method,status,amount,currency,reference,receipt',
      ...payments.map((p) =>
        [
          p.id,
          p.resident.residentNumber,
          p.resident.fullName,
          p.paymentDate.toISOString(),
          p.method,
          p.status,
          p.amount.toFixed(2),
          p.currency,
          p.transactionReference,
          p.receipt?.receiptNumber,
        ]
          .map(escape)
          .join(','),
      ),
    ].join('\n');
  }
  private async confirmPayment(
    actor: RequestUser,
    paymentId: string,
    selectedDueIds?: string[],
  ) {
    const payment = await this.prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findFirst({
          where: { id: paymentId, societyId: actor.societyId },
        });
        if (!payment) throw new NotFoundException('Payment not found.');
        if (payment.status === 'CONFIRMED') return payment;
        if (!['PENDING_VERIFICATION', 'INITIATED'].includes(payment.status))
          throw new ConflictException(
            'Payment cannot be confirmed in its current status.',
          );
        await tx.$queryRaw`SELECT id FROM "monthly_due" WHERE "resident_id" = ${payment.residentId}::uuid FOR UPDATE`;
        const storedCriteria = payment.allocationCriteria as {
          selectedDueIds?: string[];
        } | null;
        const requestedDueIds =
          selectedDueIds ?? storedCriteria?.selectedDueIds ?? [];
        const dues = await tx.monthlyDue.findMany({
          where: {
            residentId: payment.residentId,
            societyId: actor.societyId,
            status: {
              in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE', 'UPCOMING'],
            },
            ...(requestedDueIds.length ? { id: { in: requestedDueIds } } : {}),
          },
          include: { lineItems: true },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        });
        const allocation = allocateOldestFirst(
          payment.amount,
          dues.map((due) => ({
            id: due.id,
            dueDate: due.dueDate,
            principalRemaining: due.totalAmount
              .sub(due.paidAmount)
              .sub(due.waivedAmount),
            lateFeeRemaining: 0,
          })),
        );
        for (const item of allocation.allocations) {
          const due = dues.find((value) => value.id === item.dueId)!;
          const paid = money(due.paidAmount.add(item.amount));
          await tx.paymentAllocation.create({
            data: { paymentId, monthlyDueId: due.id, amount: item.amount },
          });
          await tx.monthlyDue.update({
            where: { id: due.id },
            data: {
              paidAmount: paid,
              status: dueStatus(
                due.totalAmount,
                paid,
                due.waivedAmount,
                due.graceEndsAt,
                new Date(),
              ) as any,
              version: { increment: 1 },
            },
          });
          await tx.financialLedgerEntry.create({
            data: {
              societyId: actor.societyId,
              residentId: payment.residentId,
              monthlyDueId: due.id,
              paymentId,
              type: 'PAYMENT',
              direction: 'CREDIT',
              amount: item.amount,
              currency: payment.currency,
              eventDate: payment.paymentDate,
              reference: payment.transactionReference ?? payment.id,
              description: 'Payment allocation',
              idempotencyKey: `ledger:payment:${payment.id}:${due.id}`,
            },
          });
        }
        if (allocation.advanceCredit.gt(0)) {
          await tx.residentCreditBalance.upsert({
            where: { residentId: payment.residentId },
            create: {
              residentId: payment.residentId,
              amount: allocation.advanceCredit,
              currency: payment.currency,
            },
            update: {
              amount: { increment: allocation.advanceCredit },
              version: { increment: 1 },
            },
          });
          await tx.financialLedgerEntry.create({
            data: {
              societyId: actor.societyId,
              residentId: payment.residentId,
              paymentId,
              type: 'ADVANCE_CREDIT',
              direction: 'CREDIT',
              amount: allocation.advanceCredit,
              currency: payment.currency,
              eventDate: payment.paymentDate,
              reference: payment.id,
              description: 'Unallocated advance credit',
              idempotencyKey: `ledger:advance:${payment.id}`,
            },
          });
        }
        const confirmed = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
            version: { increment: 1 },
          },
        });
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'Payment',
            aggregateId: payment.id,
            eventType: 'PAYMENT_CONFIRMED',
            payload: {
              societyId: actor.societyId,
              residentId: payment.residentId,
              paymentId: payment.id,
            },
            deduplicationKey: `outbox:payment:${payment.id}:confirmed`,
          },
        });
        await tx.auditLog.create({
          data: {
            societyId: actor.societyId,
            actorUserId: actor.id,
            action: 'PAYMENT_CONFIRMED',
            targetType: 'Payment',
            targetId: payment.id,
            outcome: 'SUCCESS',
            safeMetadata: {
              method: payment.method,
              currency: payment.currency,
            },
          },
        });
        return confirmed;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 30_000,
      },
    );
    await this.receipts.createForPayment(payment.id, actor.id);
    return this.payment(actor, payment.id);
  }
  private periodRange(year: number, month: number) {
    return {
      start: new Date(Date.UTC(year, month - 1, 1)),
      end: new Date(Date.UTC(year, month, 0)),
    };
  }
  private eligibleResidents(
    societyId: string,
    start: Date,
    end: Date,
    tx: any = this.prisma,
  ) {
    return tx.resident.findMany({
      where: {
        societyId,
        status: { in: ['ACTIVE', 'MOVED_OUT'] },
        occupancies: {
          some: {
            startDate: { lte: end },
            OR: [{ endDate: null }, { endDate: { gte: start } }],
          },
        },
      },
      include: {
        feeAssignments: {
          where: {
            effectiveFrom: { lte: end },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
          },
          orderBy: { effectiveFrom: 'desc' },
        },
        occupancies: {
          where: {
            startDate: { lte: end },
            OR: [{ endDate: null }, { endDate: { gte: start } }],
          },
          take: 1,
          include: { unit: { include: { property: true } } },
        },
      },
    });
  }
  private async resolveFee(
    societyId: string,
    resident: any,
    date: Date,
    tx: any = this.prisma,
  ) {
    const assignment = resident.feeAssignments?.[0];
    if (assignment) {
      if (assignment.feePlanId) {
        const plan = await tx.feePlan.findUnique({
          where: { id: assignment.feePlanId },
        });
        if (plan) return this.resolvedPlan(plan, 'RESIDENT_ASSIGNMENT');
      }
      return {
        planId: null,
        planName: 'Resident assignment',
        amount: money(assignment.monthlyAmount),
        currency: assignment.currency,
        source: 'RESIDENT_ASSIGNMENT',
        dueDay: 10,
        graceDays: 0,
        lateFeeType: 'NONE',
        lateFeeValue: money(0),
      };
    }
    const occupancy = resident.occupancies?.[0];
    const baseWhere = {
      societyId,
      active: true,
      effectiveFrom: { lte: date },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
    };
    const plan = occupancy
      ? await tx.feePlan.findFirst({
          where: {
            ...baseWhere,
            OR: undefined,
            AND: [
              { OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }] },
              {
                OR: [
                  { scope: 'UNIT', unitId: occupancy.unitId },
                  {
                    scope: 'PROPERTY_TYPE',
                    propertyType: occupancy.unit.property.type,
                  },
                  { scope: 'SOCIETY_DEFAULT' },
                ],
              },
            ],
          },
          orderBy: [{ scope: 'desc' }, { effectiveFrom: 'desc' }],
        })
      : await tx.feePlan.findFirst({
          where: { ...baseWhere, scope: 'SOCIETY_DEFAULT' },
          orderBy: { effectiveFrom: 'desc' },
        });
    return plan ? this.resolvedPlan(plan, plan.scope) : null;
  }
  private resolvedPlan(plan: any, source: string) {
    return {
      planId: plan.id,
      planName: plan.name,
      amount: money(plan.monthlyBaseAmount),
      currency: plan.currency,
      source,
      dueDay: plan.dueDay,
      graceDays: plan.gracePeriodDays,
      lateFeeType: plan.lateFeeType,
      lateFeeValue: money(plan.lateFeeValue),
    };
  }
  private async ownResident(actor: RequestUser) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId: actor.societyId, userId: actor.id },
    });
    if (!resident)
      throw new NotFoundException(
        'No resident profile is linked to this account.',
      );
    return resident;
  }
  private async assertResidentAccess(actor: RequestUser, residentId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId: actor.societyId },
    });
    if (!resident) throw new NotFoundException('Resident not found.');
    if (
      resident.userId !== actor.id &&
      !actor.permissions.includes('BILLING_DUE_READ')
    )
      throw new ForbiddenException('Financial record access is not permitted.');
  }
  private async ownedPayment(actor: RequestUser, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, societyId: actor.societyId },
      include: { resident: true },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (
      payment.resident.userId !== actor.id &&
      !actor.permissions.includes('BILLING_DUE_READ')
    )
      throw new ForbiddenException('Payment access is not permitted.');
    return payment;
  }
  private audit(
    actor: RequestUser,
    action: string,
    targetType: string,
    targetId: string,
    safeMetadata: Prisma.InputJsonValue = {},
    reason?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action,
        targetType,
        targetId,
        outcome: 'SUCCESS',
        reason,
        safeMetadata,
      },
    });
  }
}
