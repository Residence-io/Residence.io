import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  MatchBankStatementLineDto,
  CreateReconciliationDto,
} from '../dto/finance-expansion.dto';
import {
  BankStatementLineStatus,
  BankReconciliationStatus,
} from '../../generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class ReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async importStatementCsv(
    societyId: string,
    userId: string,
    bankAccountId: string,
    fileName: string,
    csvContent: string,
  ) {
    const bankAccount = await this.prisma.societyBankAccount.findFirst({
      where: { id: bankAccountId, societyId },
    });
    if (!bankAccount) {
      throw new NotFoundException('Bank account not found.');
    }

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or missing data rows.');
    }

    // Anti formula injection sanitization function
    const sanitize = (val: string) => {
      const cleaned = val.replace(/^["']|["']$/g, '').trim();
      if (/^[=+-@]/.test(cleaned)) return `'${cleaned}`;
      return cleaned;
    };

    const parsedLines: Array<{
      transactionDate: Date;
      description: string;
      reference?: string;
      debit: Decimal;
      credit: Decimal;
      balance?: Decimal;
    }> = [];

    // Parse header and rows (Date, Description, Reference, Debit, Credit, Balance)
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => sanitize(c));
      if (cols.length >= 3) {
        const date = new Date(cols[0]);
        if (isNaN(date.getTime())) continue;

        const description = cols[1] || 'Bank Transaction';
        const reference = cols[2] || undefined;
        const debit =
          cols[3] && !isNaN(Number(cols[3]))
            ? new Decimal(cols[3])
            : new Decimal(0);
        const credit =
          cols[4] && !isNaN(Number(cols[4]))
            ? new Decimal(cols[4])
            : new Decimal(0);
        const balance =
          cols[5] && !isNaN(Number(cols[5])) ? new Decimal(cols[5]) : undefined;

        parsedLines.push({
          transactionDate: date,
          description,
          reference,
          debit,
          credit,
          balance,
        });
      }
    }

    if (!parsedLines.length) {
      throw new BadRequestException(
        'No valid transaction rows parsed from CSV.',
      );
    }

    const sortedDates = [...parsedLines].sort(
      (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
    );
    const startDate = sortedDates[0].transactionDate;
    const endDate = sortedDates[sortedDates.length - 1].transactionDate;

    const statement = await this.prisma.$transaction(async (tx) => {
      const stmt = await tx.bankStatement.create({
        data: {
          societyId,
          bankAccountId,
          fileName,
          statementStartDate: startDate,
          statementEndDate: endDate,
          importedByUserId: userId,
          lines: {
            create: parsedLines.map((l) => ({
              transactionDate: l.transactionDate,
              description: l.description,
              reference: l.reference || null,
              debit: l.debit,
              credit: l.credit,
              balance: l.balance || null,
              status: BankStatementLineStatus.UNMATCHED,
            })),
          },
        },
        include: { lines: true },
      });

      return stmt;
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'BANK_STATEMENT_IMPORTED',
      targetType: 'BankStatement',
      targetId: statement.id,
      outcome: 'SUCCESS',
      safeMetadata: { fileName, rowCount: parsedLines.length },
    });

    return statement;
  }

  async listStatementLines(
    societyId: string,
    bankAccountId: string,
    status?: BankStatementLineStatus,
  ) {
    return this.prisma.bankStatementLine.findMany({
      where: {
        statement: { societyId, bankAccountId },
        ...(status ? { status } : {}),
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async matchStatementLine(
    societyId: string,
    lineId: string,
    userId: string,
    dto: MatchBankStatementLineDto,
  ) {
    const line = await this.prisma.bankStatementLine.findFirst({
      where: { id: lineId, statement: { societyId } },
    });
    if (!line) {
      throw new NotFoundException('Statement line not found.');
    }

    if (line.status === BankStatementLineStatus.MATCHED) {
      throw new ConflictException('Statement line is already matched.');
    }

    // Direction-aware validation
    if (dto.matchedEntityType === 'PAYMENT' && Number(line.credit) <= 0) {
      throw new BadRequestException(
        'Resident payments must match incoming bank credit statement lines.',
      );
    }

    if (dto.matchedEntityType === 'EXPENSE' && Number(line.debit) <= 0) {
      throw new BadRequestException(
        'Society expenses must match outgoing bank debit statement lines.',
      );
    }

    const updateResult = await this.prisma.bankStatementLine.updateMany({
      where: {
        id: lineId,
        status: BankStatementLineStatus.UNMATCHED,
      },
      data: {
        status: BankStatementLineStatus.MATCHED,
        matchedEntityType: dto.matchedEntityType,
        matchedEntityId: dto.matchedEntityId,
        matchedAt: new Date(),
        matchedByUserId: userId,
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictException('Statement line has already been matched.');
    }

    const updated = await this.prisma.bankStatementLine.findFirst({
      where: { id: lineId },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'BANK_TRANSACTION_MATCHED',
      targetType: 'BankStatementLine',
      targetId: line.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        matchedEntityType: dto.matchedEntityType,
        matchedEntityId: dto.matchedEntityId,
      },
    });

    return updated!;
  }

  async createReconciliation(
    societyId: string,
    userId: string,
    dto: CreateReconciliationDto,
  ) {
    const bankAccount = await this.prisma.societyBankAccount.findFirst({
      where: { id: dto.bankAccountId, societyId },
    });
    if (!bankAccount) {
      throw new NotFoundException('Bank account not found.');
    }

    const ledgerBalance = new Decimal(bankAccount.currentBalance);
    const stmtBalance = new Decimal(dto.statementBalance);
    const difference = stmtBalance.sub(ledgerBalance);

    const rec = await this.prisma.bankReconciliation.create({
      data: {
        societyId,
        bankAccountId: dto.bankAccountId,
        reconciliationDate: new Date(dto.reconciliationDate),
        statementBalance: stmtBalance,
        ledgerBalance,
        difference,
        status: BankReconciliationStatus.COMPLETED,
        notes: dto.notes || null,
        completedAt: new Date(),
        completedByUserId: userId,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'RECONCILIATION_COMPLETED',
      targetType: 'BankReconciliation',
      targetId: rec.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        statementBalance: Number(stmtBalance),
        difference: Number(difference),
      },
    });

    return rec;
  }
}
