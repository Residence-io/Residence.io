import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateExpenseDto,
  ReviewExpenseDto,
  PayExpenseDto,
} from '../dto/finance-expansion.dto';
import {
  ExpenseStatus,
  BankTransactionDirection,
  BankTransactionType,
} from '../../generated/prisma/client';
import { randomBytes } from 'node:crypto';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private generateExpenseNumber(year: number): string {
    const randomHex = randomBytes(5).toString('hex').toUpperCase();
    return `EXP-${year}-${randomHex}`;
  }

  async listExpenses(
    societyId: string,
    filters?: {
      status?: ExpenseStatus;
      category?: string;
      vendorId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.prisma.expense.findMany({
      where: {
        societyId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.category ? { category: filters.category as any } : {}),
        ...(filters?.vendorId ? { vendorId: filters.vendorId } : {}),
        ...(filters?.startDate || filters?.endDate
          ? {
              expenseDate: {
                ...(filters.startDate
                  ? { gte: new Date(filters.startDate) }
                  : {}),
                ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        vendor: { select: { id: true, name: true, vendorCode: true } },
        bankAccount: {
          select: { id: true, bankName: true, accountNumberMasked: true },
        },
        approvedByUser: { select: { id: true, displayName: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async getExpenseById(societyId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, societyId },
      include: {
        vendor: true,
        bankAccount: true,
        approvedByUser: { select: { id: true, displayName: true } },
      },
    });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }
    return expense;
  }

  async createExpense(
    societyId: string,
    userId: string,
    dto: CreateExpenseDto,
  ) {
    const year = new Date().getFullYear();
    const amount = new Decimal(dto.amount);
    if (amount.lte(0)) {
      throw new BadRequestException('Expense amount must be positive.');
    }

    if (dto.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({
        where: { id: dto.vendorId, societyId },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found.');
      }
    }

    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      const expenseNumber = this.generateExpenseNumber(year);
      try {
        const expense = await this.prisma.expense.create({
          data: {
            societyId,
            expenseNumber,
            category: dto.category,
            description: dto.description,
            expenseDate: new Date(dto.expenseDate),
            amount,
            currency: dto.currency || 'PKR',
            vendorId: dto.vendorId || null,
            invoiceNumber: dto.invoiceNumber || null,
            invoiceObjectKey: dto.invoiceObjectKey || null,
            bankAccountId: dto.bankAccountId || null,
            status: ExpenseStatus.SUBMITTED,
            notes: dto.notes || null,
          },
        });

        await this.audit.recordSafely({
          societyId,
          actorUserId: userId,
          action: 'EXPENSE_CREATED',
          targetType: 'Expense',
          targetId: expense.id,
          outcome: 'SUCCESS',
          safeMetadata: {
            expenseNumber: expense.expenseNumber,
            amount: Number(expense.amount),
            category: expense.category,
          },
        });

        return expense;
      } catch (err: any) {
        if (err?.code === 'P2002' && attempts < 3) {
          continue;
        }
        throw err;
      }
    }
  }

  async reviewExpense(
    societyId: string,
    id: string,
    reviewerUserId: string,
    dto: ReviewExpenseDto,
  ) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, societyId },
    });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (
      expense.status !== ExpenseStatus.SUBMITTED &&
      expense.status !== ExpenseStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Expense must be in SUBMITTED or DRAFT status to review.',
      );
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: dto.status,
        approvedByUserId: reviewerUserId,
        approvedAt: new Date(),
        rejectionReason:
          dto.status === ExpenseStatus.REJECTED ? dto.rejectionReason : null,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: reviewerUserId,
      action:
        dto.status === ExpenseStatus.APPROVED
          ? 'EXPENSE_APPROVED'
          : 'EXPENSE_REJECTED',
      targetType: 'Expense',
      targetId: expense.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        expenseNumber: expense.expenseNumber,
        status: dto.status,
      },
    });

    return updated;
  }

  async payExpense(
    societyId: string,
    id: string,
    actorUserId: string,
    dto: PayExpenseDto,
  ) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, societyId },
    });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (expense.status !== ExpenseStatus.APPROVED) {
      throw new BadRequestException(
        'Expense must be APPROVED before it can be paid.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Atomic status transition: update only if still APPROVED
      const updateResult = await tx.expense.updateMany({
        where: {
          id,
          societyId,
          status: ExpenseStatus.APPROVED,
        },
        data: {
          status: ExpenseStatus.PAID,
          paidAt: new Date(),
          paymentMethod: dto.paymentMethod,
          bankAccountId: dto.bankAccountId || expense.bankAccountId,
          notes: dto.notes
            ? `${expense.notes ? expense.notes + ' \n' : ''}${dto.notes}`
            : expense.notes,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'This expense has already been paid or is no longer payable.',
        );
      }

      const updated = await tx.expense.findFirst({
        where: { id, societyId },
      });

      // 2. If bank account provided, deduct balance and record immutable bank transaction
      if (updated?.bankAccountId) {
        await tx.societyBankTransaction.create({
          data: {
            societyId,
            bankAccountId: updated.bankAccountId,
            direction: BankTransactionDirection.DEBIT,
            type: BankTransactionType.EXPENSE_PAYMENT,
            amount: updated.amount,
            currency: updated.currency,
            expenseId: updated.id,
            reference: updated.expenseNumber,
            occurredAt: updated.paidAt || new Date(),
            createdByUserId: actorUserId,
          },
        });

        await tx.societyBankAccount.update({
          where: { id: updated.bankAccountId },
          data: {
            currentBalance: { decrement: updated.amount },
          },
        });
      }

      await this.audit.recordSafely({
        societyId,
        actorUserId,
        action: 'EXPENSE_PAID',
        targetType: 'Expense',
        targetId: expense.id,
        outcome: 'SUCCESS',
        safeMetadata: {
          expenseNumber: expense.expenseNumber,
          amount: Number(expense.amount),
          paymentMethod: dto.paymentMethod,
        },
      });

      return updated!;
    });
  }

  async voidExpense(
    societyId: string,
    id: string,
    actorUserId: string,
    reason?: string,
  ) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, societyId },
    });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (expense.status === ExpenseStatus.PAID) {
      throw new BadRequestException(
        'Paid expenses cannot be voided directly. An authorized reversal adjustment must be recorded.',
      );
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.VOID,
        notes: reason ? `VOID: ${reason}` : expense.notes,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action: 'EXPENSE_VOIDED',
      targetType: 'Expense',
      targetId: id,
      outcome: 'SUCCESS',
      safeMetadata: { reason },
    });

    return updated;
  }
}
