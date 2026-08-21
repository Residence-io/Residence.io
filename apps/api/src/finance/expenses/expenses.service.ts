import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateExpenseDto,
  ReviewExpenseDto,
  PayExpenseDto,
} from '../dto/finance-expansion.dto';
import { ExpenseStatus } from '../../generated/prisma/client';
import { randomBytes } from 'node:crypto';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private generateExpenseNumber(): string {
    const year = new Date().getFullYear();
    const rand = randomBytes(5).toString('hex').toUpperCase();
    return `EXP-${year}-${rand}`;
  }

  async listExpenses(
    societyId: string,
    query?: {
      status?: ExpenseStatus;
      category?: any;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.prisma.expense.findMany({
      where: {
        societyId,
        ...(query?.status ? { status: query.status } : {}),
        ...(query?.category ? { category: query.category } : {}),
        ...(query?.startDate && query?.endDate
          ? {
              expenseDate: {
                gte: new Date(query.startDate),
                lte: new Date(query.endDate),
              },
            }
          : {}),
      },
      include: {
        vendor: { select: { id: true, name: true, vendorCode: true } },
        bankAccount: {
          select: { id: true, bankName: true, accountTitle: true },
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
    let attempts = 0;
    const maxAttempts = 3;
    let expense: any = null;

    while (attempts < maxAttempts) {
      try {
        const expenseNumber = this.generateExpenseNumber();
        expense = await this.prisma.expense.create({
          data: {
            societyId,
            expenseNumber,
            vendorId: dto.vendorId || null,
            category: dto.category,
            description: dto.description,
            expenseDate: new Date(dto.expenseDate),
            amount: new Decimal(dto.amount),
            currency: dto.currency || 'PKR',
            status: ExpenseStatus.SUBMITTED,
            invoiceNumber: dto.invoiceNumber || null,
            invoiceObjectKey: dto.invoiceObjectKey || null,
            paymentMethod: dto.paymentMethod || null,
            bankAccountId: dto.bankAccountId || null,
            notes: dto.notes || null,
          },
        });
        break;
      } catch (err: any) {
        if (
          err?.code === 'P2002' &&
          (err?.meta?.target?.includes('expense_number') ||
            err?.meta?.target?.includes('expenseNumber'))
        ) {
          attempts++;
          if (attempts >= maxAttempts) throw err;
          continue;
        }
        throw err;
      }
    }

    if (!expense) {
      throw new BadRequestException(
        'Could not generate unique expense number. Please try again.',
      );
    }

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'EXPENSE_CREATED',
      targetType: 'Expense',
      targetId: expense.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        expenseNumber: expense.expenseNumber,
        amount: dto.amount,
        category: dto.category,
      },
    });

    return expense;
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
      // 1. Mark expense paid
      const updated = await tx.expense.update({
        where: { id },
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

      // 2. If bank account provided, deduct balance
      if (updated.bankAccountId) {
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

      return updated;
    });
  }

  async voidExpense(
    societyId: string,
    id: string,
    actorUserId: string,
    reason: string,
  ) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, societyId },
    });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (expense.status === ExpenseStatus.PAID) {
      throw new BadRequestException(
        'Paid expenses cannot be voided directly without accounting reversal.',
      );
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.VOID,
        rejectionReason: reason,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action: 'EXPENSE_VOIDED',
      targetType: 'Expense',
      targetId: expense.id,
      outcome: 'SUCCESS',
      safeMetadata: { expenseNumber: expense.expenseNumber, reason },
    });

    return updated;
  }
}
