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
    return this.prisma.budget.findMany({
      where: { societyId },
      include: {
        lines: true,
        approvedByUser: { select: { id: true, displayName: true } },
      },
      orderBy: { financialYear: 'desc' },
    });
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

    const society = await this.prisma.society.findFirst({
      where: { id: societyId },
      select: { fiscalYearStartMonth: true },
    });
    const fiscalMonth =
      society?.fiscalYearStartMonth &&
      society.fiscalYearStartMonth >= 1 &&
      society.fiscalYearStartMonth <= 12
        ? society.fiscalYearStartMonth
        : 7;

    let startDate: Date;
    let endDate: Date;

    const multiYearMatch = budget.financialYear.match(/^(\d{4})-(\d{4})$/);
    if (multiYearMatch) {
      const startYear = parseInt(multiYearMatch[1], 10);
      const endYear = parseInt(multiYearMatch[2], 10);
      startDate = new Date(Date.UTC(startYear, fiscalMonth - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(endYear, fiscalMonth - 1, 1, 0, 0, 0, 0));
    } else {
      const singleYearMatch = budget.financialYear.match(/^(\d{4})$/);
      const year = singleYearMatch
        ? parseInt(singleYearMatch[1], 10)
        : new Date().getFullYear();
      if (fiscalMonth === 1) {
        startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
      } else {
        startDate = new Date(Date.UTC(year, fiscalMonth - 1, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year + 1, fiscalMonth - 1, 1, 0, 0, 0, 0));
      }
    }

    // Dynamic Actual and Committed spend calculation within financial year boundaries
    const expenses = await this.prisma.expense.findMany({
      where: {
        societyId,
        status: { in: [ExpenseStatus.PAID, ExpenseStatus.APPROVED] },
        expenseDate: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const linesWithActuals = budget.lines.map((line) => {
      const actualAmount = expenses
        .filter(
          (e) =>
            e.category === line.category && e.status === ExpenseStatus.PAID,
        )
        .reduce((sum, e) => sum.add(e.amount), new Decimal(0));

      const committedAmount = expenses
        .filter(
          (e) =>
            e.category === line.category && e.status === ExpenseStatus.APPROVED,
        )
        .reduce((sum, e) => sum.add(e.amount), new Decimal(0));

      const planned = new Decimal(line.plannedAmount);
      const variance = planned.sub(actualAmount);

      return {
        ...line,
        plannedAmount: planned.toFixed(2),
        actualAmount: actualAmount.toFixed(2),
        committedAmount: committedAmount.toFixed(2),
        variance: variance.toFixed(2),
      };
    });

    return {
      ...budget,
      fiscalYearStart: startDate.toISOString(),
      fiscalYearEnd: endDate.toISOString(),
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
        notes: dto.notes || null,
        status: BudgetStatus.DRAFT,
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
      safeMetadata: {
        name: budget.name,
        financialYear: budget.financialYear,
        lineCount: budget.lines?.length ?? dto.lines.length,
      },
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

    if (budget.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT budgets can be updated.');
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: {
        name: dto.name,
        notes: dto.notes,
      },
      include: { lines: true },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'BUDGET_UPDATED',
      targetType: 'Budget',
      targetId: id,
      outcome: 'SUCCESS',
      safeMetadata: { name: updated.name },
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

    if (budget.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT budgets can be approved.');
    }

    const approved = await this.prisma.budget.update({
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
      targetId: id,
      outcome: 'SUCCESS',
      safeMetadata: { financialYear: approved.financialYear },
    });

    return approved;
  }
}
