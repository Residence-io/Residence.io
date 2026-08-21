import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateBankAccountDto,
  UpdateBankAccountDto,
} from '../dto/finance-expansion.dto';
import {
  BankTransactionDirection,
  BankTransactionType,
} from '../../generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class BankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listAccounts(societyId: string, onlyActive = false) {
    return this.prisma.societyBankAccount.findMany({
      where: {
        societyId,
        ...(onlyActive ? { isActive: true } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { bankName: 'asc' }],
    });
  }

  async getAccountById(societyId: string, id: string) {
    const account = await this.prisma.societyBankAccount.findFirst({
      where: { id, societyId },
      include: {
        statements: {
          orderBy: { statementStartDate: 'desc' },
          take: 10,
        },
      },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found.');
    }
    return account;
  }

  async createAccount(
    societyId: string,
    userId: string,
    dto: CreateBankAccountDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.societyBankAccount.updateMany({
          where: { societyId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const openingBalance = new Decimal(dto.openingBalance || 0);

      const account = await tx.societyBankAccount.create({
        data: {
          societyId,
          bankName: dto.bankName,
          accountTitle: dto.accountTitle,
          accountNumberMasked: dto.accountNumberMasked,
          iban: dto.iban || null,
          branchCode: dto.branchCode || null,
          currency: dto.currency || 'PKR',
          openingBalance,
          currentBalance: openingBalance,
          isDefault: dto.isDefault || false,
          isActive: true,
          depositInstructions: dto.depositInstructions || null,
        },
      });

      if (openingBalance.gt(0)) {
        await tx.societyBankTransaction.create({
          data: {
            societyId,
            bankAccountId: account.id,
            direction: BankTransactionDirection.CREDIT,
            type: BankTransactionType.OPENING_BALANCE,
            amount: openingBalance,
            currency: account.currency,
            reference: 'OPENING-BALANCE',
            occurredAt: new Date(),
            createdByUserId: userId,
          },
        });
      }

      await this.audit.recordSafely({
        societyId,
        actorUserId: userId,
        action: 'BANK_ACCOUNT_CREATED',
        targetType: 'SocietyBankAccount',
        targetId: account.id,
        outcome: 'SUCCESS',
        safeMetadata: {
          bankName: account.bankName,
          accountTitle: account.accountTitle,
        },
      });

      return account;
    });
  }

  async updateAccount(
    societyId: string,
    id: string,
    userId: string,
    dto: UpdateBankAccountDto,
  ) {
    const account = await this.prisma.societyBankAccount.findFirst({
      where: { id, societyId },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found.');
    }

    if (dto.isDefault) {
      await this.prisma.societyBankAccount.updateMany({
        where: { societyId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.societyBankAccount.update({
      where: { id },
      data: {
        bankName: dto.bankName,
        accountTitle: dto.accountTitle,
        accountNumberMasked: dto.accountNumberMasked,
        iban: dto.iban,
        branchCode: dto.branchCode,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
        depositInstructions: dto.depositInstructions,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'BANK_ACCOUNT_UPDATED',
      targetType: 'SocietyBankAccount',
      targetId: id,
      outcome: 'SUCCESS',
      safeMetadata: { bankName: updated.bankName },
    });

    return updated;
  }

  async reconstructBalance(societyId: string, bankAccountId: string) {
    const account = await this.prisma.societyBankAccount.findFirst({
      where: { id: bankAccountId, societyId },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found.');
    }

    const transactions = await this.prisma.societyBankTransaction.findMany({
      where: { bankAccountId, societyId },
    });

    const totalCredits = transactions
      .filter((t) => t.direction === BankTransactionDirection.CREDIT)
      .reduce((sum, t) => sum.add(t.amount), new Decimal(0));

    const totalDebits = transactions
      .filter((t) => t.direction === BankTransactionDirection.DEBIT)
      .reduce((sum, t) => sum.add(t.amount), new Decimal(0));

    const calculatedBalance = totalCredits.sub(totalDebits);

    return {
      bankAccountId: account.id,
      storedCurrentBalance: account.currentBalance.toFixed(2),
      calculatedBalance: calculatedBalance.toFixed(2),
      isReconciled: calculatedBalance.equals(account.currentBalance),
      totalCredits: totalCredits.toFixed(2),
      totalDebits: totalDebits.toFixed(2),
      transactionCount: transactions.length,
    };
  }
}
