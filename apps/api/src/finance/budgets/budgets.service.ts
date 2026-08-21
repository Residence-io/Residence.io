import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto/finance-expansion.dto';
import { BudgetStatus, ExpenseStatus } from '../../generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listBudgets(societyId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { societyId },
      include: {
        lines: true,
        approvedByUser: { select: { id: true, displayName: true } },
      },
      orderBy: { financialYear: 'desc' },
    });

    return budgets;
  }

  async getBudgetById(societyId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, societyId },
      include: {
        lines: true,
        approvedByUser: { select: { id: true, displayName: true } },
      },
    });
    if (!budget) {
      throw new NotFoundException('Budget not found.');
    }

    const yearMatch = budget.financialYear.match(/(\d{4})/g);
    const startYear = yearMatch
      ? parseInt(yearMatch[0], 10)
      : new Date().getFullYear();
    const endYear =
      yearMatch && yearMatch.length > 1
        ? parseInt(yearMatch[1], 10)
        : startYear;
    const startDate = new Date(Date.UTC(startYear, 0, 1));
    const endDate = new Date(Date.UTC(endYear, 11, 31, 23, 59, 59, 999));

    // Dynamic Actual spend calculation from authoritative paid expenses within financial year
    const expenses = await this.prisma.expense.findMany({
      where: {
        societyId,
        status: ExpenseStatus.PAID,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const linesWithActuals = budget.lines.map((line) => {
      const actualAmount = expenses
        .filter((e) => e.category === line.category)
        .reduce((sum, e) => sum.add(e.amount), new Decimal(0));
      const planned = new Decimal(line.plannedAmount);
      const variance = planned.sub(actualAmount);

      return {
        ...line,
        plannedAmount: planned.toFixed(2),
        actualAmount: actualAmount.toFixed(2),
        variance: variance.toFixed(2),
      };
    });

    return {
      ...budget,
      lines: linesWithActuals,
    };
  }

  async createBudget(societyId: string, userId: string, dto: CreateBudgetDto) {
    const existing = await this.prisma.budget.findFirst({
      where: { societyId, financialYear: dto.financialYear },
    });
    if (existing) {
      throw new BadRequestException(
        `A budget for financial year ${dto.financialYear} already exists.`,
      );
    }

    const budget = await this.prisma.budget.create({
      data: {
        societyId,
        name: dto.name,
        financialYear: dto.financialYear,
        status: BudgetStatus.DRAFT,
        notes: dto.notes || null,
        lines: {
          create: dto.lines.map((l) => ({
            category: l.category,
            plannedAmount: new Decimal(l.plannedAmount),
            notes: l.notes || null,
          })),
        },
      },
      include: { lines: true },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'BUDGET_CREATED',
      targetType: 'Budget',
      targetId: budget.id,
      outcome: 'SUCCESS',
      safeMetadata: { name: budget.name, financialYear: budget.financialYear },
    });

    return budget;
  }

  async updateBudget(
    societyId: string,
    id: string,
    userId: string,
    dto: UpdateBudgetDto,
  ) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, societyId },
    });
    if (!budget) {
      throw new NotFoundException('Budget not found.');
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: { lines: true },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'BUDGET_UPDATED',
      targetType: 'Budget',
      targetId: budget.id,
      outcome: 'SUCCESS',
      safeMetadata: { name: updated.name, status: updated.status },
    });

    return updated;
  }

  async approveBudget(societyId: string, id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, societyId },
    });
    if (!budget) {
      throw new NotFoundException('Budget not found.');
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: {
        status: BudgetStatus.APPROVED,
        approvedByUserId: userId,
        approvedAt: new Date(),
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'BUDGET_APPROVED',
      targetType: 'Budget',
      targetId: budget.id,
      outcome: 'SUCCESS',
      safeMetadata: { name: budget.name, financialYear: budget.financialYear },
    });

    return updated;
  }
}
