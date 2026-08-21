import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateBankAccountDto,
  UpdateBankAccountDto,
} from '../dto/finance-expansion.dto';
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
    if (dto.isDefault) {
      await this.prisma.societyBankAccount.updateMany({
        where: { societyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await this.prisma.societyBankAccount.create({
      data: {
        societyId,
        bankName: dto.bankName,
        accountTitle: dto.accountTitle,
        accountNumberMasked: dto.accountNumberMasked,
        iban: dto.iban || null,
        branchCode: dto.branchCode || null,
        currency: dto.currency || 'PKR',
        openingBalance: new Decimal(dto.openingBalance || 0),
        currentBalance: new Decimal(dto.openingBalance || 0),
        isDefault: dto.isDefault || false,
        isActive: true,
        depositInstructions: dto.depositInstructions || null,
      },
    });

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
        ...(dto.bankName ? { bankName: dto.bankName } : {}),
        ...(dto.accountTitle ? { accountTitle: dto.accountTitle } : {}),
        ...(dto.accountNumberMasked
          ? { accountNumberMasked: dto.accountNumberMasked }
          : {}),
        ...(dto.iban !== undefined ? { iban: dto.iban } : {}),
        ...(dto.branchCode !== undefined ? { branchCode: dto.branchCode } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.depositInstructions !== undefined
          ? { depositInstructions: dto.depositInstructions }
          : {}),
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'BANK_ACCOUNT_UPDATED',
      targetType: 'SocietyBankAccount',
      targetId: account.id,
      outcome: 'SUCCESS',
      safeMetadata: { bankName: updated.bankName, isActive: updated.isActive },
    });

    return updated;
  }
}
