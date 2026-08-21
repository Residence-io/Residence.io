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

  private sanitizeCsvField(val: string): string {
    const trimmed = val.trim();
    if (
      trimmed.startsWith('=') ||
      trimmed.startsWith('+') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('@')
    ) {
      return `'${trimmed}`;
    }
    return trimmed;
  }

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

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or has no data rows.');
    }

    const dataRows = lines.slice(1);
    const parsedLines: Array<{
      transactionDate: Date;
      description: string;
      reference: string | null;
      debit: Decimal;
      credit: Decimal;
      balance: Decimal | null;
    }> = [];

    for (const row of dataRows) {
      const parts = row.split(',').map((p) => this.sanitizeCsvField(p));
      if (parts.length < 5) continue;
      const [dateStr, desc, ref, debitStr, creditStr, balStr] = parts;
      const txDate = new Date(dateStr);
      if (isNaN(txDate.getTime())) continue;

      const debit = new Decimal(parseFloat(debitStr) || 0);
      const credit = new Decimal(parseFloat(creditStr) || 0);
      const balance = balStr ? new Decimal(parseFloat(balStr) || 0) : null;

      parsedLines.push({
        transactionDate: txDate,
        description: desc || 'Bank transaction',
        reference: ref || null,
        debit,
        credit,
        balance,
      });
    }

    if (parsedLines.length === 0) {
      throw new BadRequestException('No valid transaction rows found in CSV.');
    }

    parsedLines.sort(
      (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
    );
    const startDate = parsedLines[0].transactionDate;
    const endDate = parsedLines[parsedLines.length - 1].transactionDate;

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
              reference: l.reference,
              debit: l.debit,
              credit: l.credit,
              balance: l.balance,
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

    // Find internal SocietyBankTransaction
    let bankTx: any = null;
    if (dto.matchedEntityType === 'PAYMENT') {
      bankTx = await this.prisma.societyBankTransaction.findFirst({
        where: { paymentId: dto.matchedEntityId, societyId },
      });
    } else if (dto.matchedEntityType === 'EXPENSE') {
      bankTx = await this.prisma.societyBankTransaction.findFirst({
        where: { expenseId: dto.matchedEntityId, societyId },
      });
    } else {
      bankTx = await this.prisma.societyBankTransaction.findFirst({
        where: { id: dto.matchedEntityId, societyId },
      });
    }

    // One-to-one protection: Check if target internal transaction is already matched to another statement line
    const alreadyMatchedInternal =
      await this.prisma.bankStatementLine.findFirst({
        where: {
          OR: [
            {
              matchedEntityType: dto.matchedEntityType,
              matchedEntityId: dto.matchedEntityId,
              status: BankStatementLineStatus.MATCHED,
            },
            ...(bankTx?.id
              ? [
                  {
                    matchedBankTransactionId: bankTx.id,
                    status: BankStatementLineStatus.MATCHED,
                  },
                ]
              : []),
          ],
        },
      });
    if (alreadyMatchedInternal) {
      throw new ConflictException(
        'This internal transaction has already been matched to another statement line.',
      );
    }

    try {
      const updateResult = await this.prisma.bankStatementLine.updateMany({
        where: {
          id: lineId,
          status: BankStatementLineStatus.UNMATCHED,
        },
        data: {
          status: BankStatementLineStatus.MATCHED,
          matchedEntityType: dto.matchedEntityType,
          matchedEntityId: dto.matchedEntityId,
          matchedBankTransactionId: bankTx?.id || null,
          matchedAt: new Date(),
          matchedByUserId: userId,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('Statement line has already been matched.');
      }
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'This internal transaction has already been matched to another statement line.',
        );
      }
      throw err;
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

    const statementBalance = new Decimal(dto.statementBalance);
    const ledgerBalance = bankAccount.currentBalance;
    const difference = statementBalance.sub(ledgerBalance);

    const rec = await this.prisma.bankReconciliation.create({
      data: {
        societyId,
        bankAccountId: dto.bankAccountId,
        reconciliationDate: new Date(dto.reconciliationDate),
        statementBalance,
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
        difference: Number(difference),
        status: rec.status,
      },
    });

    return rec;
  }
}
