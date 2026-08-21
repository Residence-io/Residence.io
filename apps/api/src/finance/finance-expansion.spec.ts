import { Test, TestingModule } from '@nestjs/testing';
import { VendorsService } from './vendors/vendors.service';
import { ExpensesService } from './expenses/expenses.service';
import { BudgetsService } from './budgets/budgets.service';
import { BankingService } from './banking/banking.service';
import { ReconciliationService } from './reconciliation/reconciliation.service';
import { ManualBankTransferProvider } from './providers/manual-bank-transfer.provider';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';

describe('Phase 6 Financial Expansion Services', () => {
  let vendorsService: VendorsService;
  let expensesService: ExpensesService;
  let budgetsService: BudgetsService;
  let bankingService: BankingService;
  let reconciliationService: ReconciliationService;
  let bankTransferProvider: ManualBankTransferProvider;

  const mockAudit = {
    recordSafely: jest.fn().mockResolvedValue(undefined),
  };

  const mockPrisma: any = {
    vendor: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    societyBankAccount: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    societyBankTransaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    bankStatement: {
      create: jest.fn(),
    },
    bankStatementLine: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    bankReconciliation: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return cb;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        ExpensesService,
        BudgetsService,
        BankingService,
        ReconciliationService,
        ManualBankTransferProvider,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    vendorsService = module.get<VendorsService>(VendorsService);
    expensesService = module.get<ExpensesService>(ExpensesService);
    budgetsService = module.get<BudgetsService>(BudgetsService);
    bankingService = module.get<BankingService>(BankingService);
    reconciliationService = module.get<ReconciliationService>(
      ReconciliationService,
    );
    bankTransferProvider = module.get<ManualBankTransferProvider>(
      ManualBankTransferProvider,
    );
    jest.clearAllMocks();
  });

  describe('VendorsService', () => {
    it('creates vendor with collision retry and audit log', async () => {
      mockPrisma.vendor.create
        .mockRejectedValueOnce({
          code: 'P2002',
          meta: { target: ['vendor_code'] },
        })
        .mockResolvedValueOnce({
          id: 'ven-1',
          societyId: 'soc-1',
          vendorCode: 'VEN-2026-AABB112233',
          name: 'Apex Elevator Services',
          status: 'ACTIVE',
        });

      const res = await vendorsService.createVendor('soc-1', 'user-1', {
        name: 'Apex Elevator Services',
      });

      expect(res.id).toBe('ven-1');
      expect(mockPrisma.vendor.create).toHaveBeenCalledTimes(2);
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'VENDOR_CREATED' }),
      );
    });

    it('enforces society isolation when getting vendor by ID', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);
      await expect(
        vendorsService.getVendorById('soc-1', 'ven-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('ExpensesService', () => {
    it('creates expense with generated reference and status SUBMITTED', async () => {
      mockPrisma.expense.create.mockResolvedValue({
        id: 'exp-1',
        expenseNumber: 'EXP-2026-CCDD445566',
        amount: new Decimal(25000),
        status: 'SUBMITTED',
      });

      const res = await expensesService.createExpense('soc-1', 'user-1', {
        category: 'MAINTENANCE' as any,
        description: 'Elevator annual overhaul',
        expenseDate: '2026-08-15',
        amount: 25000,
      });

      expect(res!.id).toBe('exp-1');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'EXPENSE_CREATED' }),
      );
    });

    it('reviews expense and updates approval status', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue({
        id: 'exp-1',
        societyId: 'soc-1',
        status: 'SUBMITTED',
      });
      mockPrisma.expense.update.mockResolvedValue({
        id: 'exp-1',
        status: 'APPROVED',
      });

      const res = await expensesService.reviewExpense(
        'soc-1',
        'exp-1',
        'admin-1',
        {
          status: 'APPROVED' as any,
        },
      );

      expect(res.status).toBe('APPROVED');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'EXPENSE_APPROVED' }),
      );
    });

    it('pays approved expense atomically, records bank debit transaction and updates bank balance', async () => {
      mockPrisma.expense.findFirst
        .mockResolvedValueOnce({
          id: 'exp-1',
          societyId: 'soc-1',
          status: 'APPROVED',
          amount: new Decimal(10000),
          currency: 'PKR',
          expenseNumber: 'EXP-2026-112233',
          bankAccountId: 'bank-1',
        })
        .mockResolvedValueOnce({
          id: 'exp-1',
          societyId: 'soc-1',
          status: 'PAID',
          amount: new Decimal(10000),
          currency: 'PKR',
          expenseNumber: 'EXP-2026-112233',
          bankAccountId: 'bank-1',
        });
      mockPrisma.expense.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.societyBankTransaction.create.mockResolvedValue({});
      mockPrisma.societyBankAccount.update.mockResolvedValue({});

      const res = await expensesService.payExpense(
        'soc-1',
        'exp-1',
        'admin-1',
        {
          paymentMethod: 'BANK_TRANSFER' as any,
        },
      );

      expect(res.status).toBe('PAID');
      expect(mockPrisma.expense.updateMany).toHaveBeenCalledWith({
        where: { id: 'exp-1', societyId: 'soc-1', status: 'APPROVED' },
        data: expect.objectContaining({ status: 'PAID' }),
      });
      expect(mockPrisma.societyBankTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: 'DEBIT',
            type: 'EXPENSE_PAYMENT',
            amount: new Decimal(10000),
          }),
        }),
      );
      expect(mockPrisma.societyBankAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bank-1' },
          data: { currentBalance: { decrement: new Decimal(10000) } },
        }),
      );
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'EXPENSE_PAID' }),
      );
    });

    it('rejects concurrent double expense payment with ConflictException', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue({
        id: 'exp-1',
        societyId: 'soc-1',
        status: 'APPROVED',
      });
      mockPrisma.expense.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        expensesService.payExpense('soc-1', 'exp-1', 'admin-1', {
          paymentMethod: 'BANK_TRANSFER' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects payment on unapproved expense', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue({
        id: 'exp-1',
        societyId: 'soc-1',
        status: 'SUBMITTED',
      });

      await expect(
        expensesService.payExpense('soc-1', 'exp-1', 'admin-1', {
          paymentMethod: 'BANK_TRANSFER' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('BudgetsService', () => {
    it('creates budget with budget lines', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null);
      mockPrisma.budget.create.mockResolvedValue({
        id: 'bud-1',
        name: 'Annual Operations Budget',
        financialYear: '2026-2027',
      });

      const res = await budgetsService.createBudget('soc-1', 'user-1', {
        name: 'Annual Operations Budget',
        financialYear: '2026-2027',
        lines: [
          { category: 'MAINTENANCE' as any, plannedAmount: 500000 },
          { category: 'SECURITY' as any, plannedAmount: 300000 },
        ],
      });

      expect(res.id).toBe('bud-1');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BUDGET_CREATED' }),
      );
    });

    it('calculates dynamic actuals and committed spend within fiscal year boundaries', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue({
        id: 'bud-1',
        societyId: 'soc-1',
        financialYear: '2026-2027',
        lines: [
          {
            id: 'bl-1',
            category: 'MAINTENANCE',
            plannedAmount: new Decimal(500000),
          },
        ],
      });
      mockPrisma.expense.findMany.mockResolvedValue([
        {
          category: 'MAINTENANCE',
          amount: new Decimal(120000),
          status: 'PAID',
        },
        {
          category: 'MAINTENANCE',
          amount: new Decimal(30000),
          status: 'APPROVED',
        },
      ]);

      const res = await budgetsService.getBudgetById('soc-1', 'bud-1');
      expect(res.lines[0].plannedAmount).toBe('500000.00');
      expect(res.lines[0].actualAmount).toBe('120000.00');
      expect(res.lines[0].committedAmount).toBe('30000.00');
      expect(res.lines[0].variance).toBe('380000.00');
    });
  });

  describe('BankingService', () => {
    it('creates society bank account, opening transaction, and handles default flag toggle', async () => {
      mockPrisma.societyBankAccount.create.mockResolvedValue({
        id: 'bank-1',
        bankName: 'Meezan Bank',
        accountTitle: 'Greenwood Society Operations',
        accountNumberMasked: '****1234',
        currency: 'PKR',
        isDefault: true,
      });
      mockPrisma.societyBankTransaction.create.mockResolvedValue({});

      const res = await bankingService.createAccount('soc-1', 'user-1', {
        bankName: 'Meezan Bank',
        accountTitle: 'Greenwood Society Operations',
        accountNumberMasked: '****1234',
        openingBalance: 100000,
        isDefault: true,
      });

      expect(res.id).toBe('bank-1');
      expect(mockPrisma.societyBankAccount.updateMany).toHaveBeenCalledWith({
        where: { societyId: 'soc-1', isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrisma.societyBankTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: 'CREDIT',
            type: 'OPENING_BALANCE',
            amount: new Decimal(100000),
          }),
        }),
      );
    });

    it('reconstructs bank account balance accurately from immutable cashbook transactions', async () => {
      mockPrisma.societyBankAccount.findFirst.mockResolvedValue({
        id: 'bank-1',
        societyId: 'soc-1',
        currentBalance: new Decimal(120000),
      });
      mockPrisma.societyBankTransaction.findMany.mockResolvedValue([
        { direction: 'CREDIT', amount: new Decimal(100000) }, // Opening
        { direction: 'CREDIT', amount: new Decimal(20000) }, // Resident Transfer 1
        { direction: 'DEBIT', amount: new Decimal(7500) }, // Expense 1
        { direction: 'CREDIT', amount: new Decimal(10000) }, // Resident Transfer 2
        { direction: 'DEBIT', amount: new Decimal(2500) }, // Expense 2
      ]);

      const recon = await bankingService.reconstructBalance('soc-1', 'bank-1');
      expect(recon.calculatedBalance).toBe('120000.00');
      expect(recon.storedCurrentBalance).toBe('120000.00');
      expect(recon.isReconciled).toBe(true);
    });
  });

  describe('ReconciliationService', () => {
    it('imports CSV statement and sanitizes against formula injection', async () => {
      mockPrisma.societyBankAccount.findFirst.mockResolvedValue({
        id: 'bank-1',
        societyId: 'soc-1',
      });
      mockPrisma.bankStatement.create.mockResolvedValue({
        id: 'stmt-1',
      });

      const csv =
        'Date,Description,Reference,Debit,Credit,Balance\n2026-08-01,=SUM(1+1),TX-1,0,5000,5000';
      const res = await reconciliationService.importStatementCsv(
        'soc-1',
        'user-1',
        'bank-1',
        'statement.csv',
        csv,
      );

      expect(res.id).toBe('stmt-1');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BANK_STATEMENT_IMPORTED' }),
      );
    });

    it('matches incoming credit statement line to payment', async () => {
      mockPrisma.bankStatementLine.findFirst
        .mockResolvedValueOnce({
          id: 'line-1',
          credit: new Decimal(5000),
          debit: new Decimal(0),
          status: 'UNMATCHED',
        })
        .mockResolvedValueOnce(null) // alreadyMatchedInternal check
        .mockResolvedValueOnce({
          id: 'line-1',
          status: 'MATCHED',
          matchedEntityType: 'PAYMENT',
          matchedEntityId: 'pay-1',
        });
      mockPrisma.bankStatementLine.updateMany.mockResolvedValue({ count: 1 });

      const res = await reconciliationService.matchStatementLine(
        'soc-1',
        'line-1',
        'user-1',
        {
          matchedEntityType: 'PAYMENT',
          matchedEntityId: 'pay-1',
        },
      );

      expect(res.status).toBe('MATCHED');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BANK_TRANSACTION_MATCHED' }),
      );
    });

    it('rejects matching same internal transaction to a second statement line with ConflictException', async () => {
      mockPrisma.bankStatementLine.findFirst
        .mockResolvedValueOnce({
          id: 'line-2',
          credit: new Decimal(5000),
          debit: new Decimal(0),
          status: 'UNMATCHED',
        })
        .mockResolvedValueOnce({
          id: 'line-1',
          status: 'MATCHED',
          matchedEntityType: 'PAYMENT',
          matchedEntityId: 'pay-1',
        }); // already matched

      await expect(
        reconciliationService.matchStatementLine('soc-1', 'line-2', 'user-1', {
          matchedEntityType: 'PAYMENT',
          matchedEntityId: 'pay-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects matching payment to debit line with BadRequestException', async () => {
      mockPrisma.bankStatementLine.findFirst.mockResolvedValue({
        id: 'line-1',
        credit: new Decimal(0),
        debit: new Decimal(5000),
        status: 'UNMATCHED',
      });

      await expect(
        reconciliationService.matchStatementLine('soc-1', 'line-1', 'user-1', {
          matchedEntityType: 'PAYMENT',
          matchedEntityId: 'pay-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects matching expense to credit line with BadRequestException', async () => {
      mockPrisma.bankStatementLine.findFirst.mockResolvedValue({
        id: 'line-1',
        credit: new Decimal(5000),
        debit: new Decimal(0),
        status: 'UNMATCHED',
      });

      await expect(
        reconciliationService.matchStatementLine('soc-1', 'line-1', 'user-1', {
          matchedEntityType: 'EXPENSE',
          matchedEntityId: 'exp-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects concurrent match on already matched statement line with ConflictException', async () => {
      mockPrisma.bankStatementLine.findFirst
        .mockResolvedValueOnce({
          id: 'line-1',
          credit: new Decimal(5000),
          debit: new Decimal(0),
          status: 'UNMATCHED',
        })
        .mockResolvedValueOnce(null);
      mockPrisma.bankStatementLine.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        reconciliationService.matchStatementLine('soc-1', 'line-1', 'user-1', {
          matchedEntityType: 'PAYMENT',
          matchedEntityId: 'pay-1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('ManualBankTransferProvider', () => {
    it('generates manual bank transfer intent instructions', async () => {
      const intent = await bankTransferProvider.createPaymentIntent(
        'soc-1',
        'res-1',
        '5000.00',
        'PKR',
      );

      expect(intent.providerReference).toContain('BT-2026-');
      expect(intent.instructions).toBeDefined();
    });
  });
});
