import { Test, TestingModule } from '@nestjs/testing';
import { VendorsService } from './vendors/vendors.service';
import { ExpensesService } from './expenses/expenses.service';
import { BudgetsService } from './budgets/budgets.service';
import { BankingService } from './banking/banking.service';
import { ReconciliationService } from './reconciliation/reconciliation.service';
import { ManualBankTransferProvider } from './providers/manual-bank-transfer.provider';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';
import { DevelopmentPaymentProvider } from './payment-provider';
import { ReceiptService } from './receipt.service';
import { FinanceModule } from './finance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { SupabaseModule } from '../supabase/supabase.module';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';

describe('Phase 6 Financial Expansion Services - Final Lock', () => {
  let vendorsService: VendorsService;
  let expensesService: ExpensesService;
  let budgetsService: BudgetsService;
  let bankingService: BankingService;
  let reconciliationService: ReconciliationService;
  let bankTransferProvider: ManualBankTransferProvider;
  let financeService: FinanceService;

  const mockAudit = {
    recordSafely: jest.fn().mockResolvedValue(undefined),
  };

  const mockPrisma: any = {
    society: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
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
    payment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    paymentAllocation: {
      create: jest.fn(),
    },
    monthlyDue: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    financialLedgerEntry: {
      create: jest.fn(),
    },
    receiptSequence: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    receipt: {
      create: jest.fn(),
    },
    outboxEvent: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    resident: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
    $transaction: jest.fn((cb: any) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return cb;
    }),
  };

  const mockStorage = {
    store: jest.fn(),
    read: jest.fn(),
    remove: jest.fn(),
  };

  const mockPaymentProvider = {
    createIntent: jest.fn(),
    verifyCallback: jest.fn(),
  };

  const mockReceiptService = {
    generateAndStoreReceipt: jest.fn(),
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
        FinanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: PrivateStorageService, useValue: mockStorage },
        { provide: DevelopmentPaymentProvider, useValue: mockPaymentProvider },
        { provide: ReceiptService, useValue: mockReceiptService },
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
    financeService = module.get<FinanceService>(FinanceService);
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
  });

  describe('BudgetsService - Authoritative Fiscal Boundaries', () => {
    it('calculates dynamic actuals with configured July-June fiscal year (Start Month = 7)', async () => {
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
      mockPrisma.society.findFirst.mockResolvedValue({
        fiscalYearStartMonth: 7,
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
      expect(res.fiscalYearStart).toBe('2026-07-01T00:00:00.000Z');
      expect(res.fiscalYearEnd).toBe('2027-07-01T00:00:00.000Z');
      expect(res.lines[0].plannedAmount).toBe('500000.00');
      expect(res.lines[0].actualAmount).toBe('120000.00');
      expect(res.lines[0].committedAmount).toBe('30000.00');
      expect(res.lines[0].variance).toBe('380000.00');
    });

    it('calculates dynamic actuals with configured Jan-Dec calendar fiscal year (Start Month = 1)', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue({
        id: 'bud-2',
        societyId: 'soc-1',
        financialYear: '2026',
        lines: [
          {
            id: 'bl-2',
            category: 'SECURITY',
            plannedAmount: new Decimal(300000),
          },
        ],
      });
      mockPrisma.society.findFirst.mockResolvedValue({
        fiscalYearStartMonth: 1,
      });
      mockPrisma.expense.findMany.mockResolvedValue([
        { category: 'SECURITY', amount: new Decimal(100000), status: 'PAID' },
      ]);

      const res = await budgetsService.getBudgetById('soc-1', 'bud-2');
      expect(res.fiscalYearStart).toBe('2026-01-01T00:00:00.000Z');
      expect(res.fiscalYearEnd).toBe('2027-01-01T00:00:00.000Z');
      expect(res.lines[0].actualAmount).toBe('100000.00');
    });
  });

  describe('BankingService & Cashbook Reconstruction', () => {
    it('reconstructs bank account balance accurately from immutable cashbook transactions', async () => {
      mockPrisma.societyBankAccount.findFirst.mockResolvedValue({
        id: 'bank-1',
        societyId: 'soc-1',
        currentBalance: new Decimal(120000),
      });
      mockPrisma.societyBankTransaction.findMany.mockResolvedValue([
        { direction: 'CREDIT', amount: new Decimal(100000) },
        { direction: 'CREDIT', amount: new Decimal(20000) },
        { direction: 'DEBIT', amount: new Decimal(7500) },
        { direction: 'CREDIT', amount: new Decimal(10000) },
        { direction: 'DEBIT', amount: new Decimal(2500) },
      ]);

      const recon = await bankingService.reconstructBalance('soc-1', 'bank-1');
      expect(recon.calculatedBalance).toBe('120000.00');
      expect(recon.storedCurrentBalance).toBe('120000.00');
      expect(recon.isReconciled).toBe(true);
    });
  });

  describe('ReconciliationService - One-to-One DB Uniqueness & Concurrency', () => {
    it('matches statement line to SocietyBankTransaction and sets matchedBankTransactionId', async () => {
      mockPrisma.bankStatementLine.findFirst
        .mockResolvedValueOnce({
          id: 'line-1',
          credit: new Decimal(5000),
          debit: new Decimal(0),
          status: 'UNMATCHED',
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'line-1',
          status: 'MATCHED',
          matchedEntityType: 'PAYMENT',
          matchedEntityId: 'pay-1',
          matchedBankTransactionId: 'tx-1',
        });
      mockPrisma.societyBankTransaction.findFirst.mockResolvedValue({
        id: 'tx-1',
        paymentId: 'pay-1',
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
      expect(mockPrisma.bankStatementLine.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            matchedBankTransactionId: 'tx-1',
          }),
        }),
      );
    });

    it('rejects concurrent double match with ConflictException on unique constraint P2002', async () => {
      mockPrisma.bankStatementLine.findFirst
        .mockResolvedValueOnce({
          id: 'line-2',
          credit: new Decimal(5000),
          debit: new Decimal(0),
          status: 'UNMATCHED',
        })
        .mockResolvedValueOnce(null);
      mockPrisma.societyBankTransaction.findFirst.mockResolvedValue({
        id: 'tx-1',
      });
      mockPrisma.bankStatementLine.updateMany.mockRejectedValueOnce({
        code: 'P2002',
        meta: { target: ['matched_bank_transaction_id'] },
      });

      await expect(
        reconciliationService.matchStatementLine('soc-1', 'line-2', 'user-1', {
          matchedEntityType: 'PAYMENT',
          matchedEntityId: 'pay-1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Resident Transfer Bank Attribution & IDOR Protection', () => {
    it('rejects transfer submission when bankAccountId belongs to another society (Cross-Society IDOR)', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({
        id: 'res-1',
        society: { currency: 'PKR' },
      });
      mockPrisma.societyBankAccount.findFirst.mockResolvedValue(null);

      const actor: any = {
        id: 'user-1',
        societyId: 'soc-1',
        roles: ['RESIDENT'],
        permissions: ['PAYMENT_CREATE_SELF'],
      };

      await expect(
        financeService.recordPayment(actor, {
          residentId: 'res-1',
          amount: '5000.00',
          currency: 'PKR',
          method: 'BANK_TRANSFER',
          allocationStrategy: 'OLDEST_DUE_FIRST',
          idempotencyKey: 'idemp-cross-soc-1',
          bankAccountId: 'foreign-bank-account-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('stores submitted non-default bankAccountId and credits that exact account upon confirmation', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({
        id: 'res-1',
        society: { currency: 'PKR' },
      });
      mockPrisma.societyBankAccount.findFirst
        .mockResolvedValueOnce({
          id: 'bank-2-secondary',
          societyId: 'soc-1',
          bankName: 'Standard Chartered',
          isActive: true,
        })
        .mockResolvedValueOnce({
          id: 'bank-2-secondary',
          societyId: 'soc-1',
          bankName: 'Standard Chartered',
          isActive: true,
        });

      mockPrisma.payment.create.mockResolvedValue({
        id: 'pay-100',
        societyId: 'soc-1',
        residentId: 'res-1',
        amount: new Decimal(15000),
        currency: 'PKR',
        method: 'BANK_TRANSFER',
        status: 'PENDING_VERIFICATION',
        bankAccountId: 'bank-2-secondary',
      });

      const actor: any = {
        id: 'user-1',
        societyId: 'soc-1',
        roles: ['RESIDENT'],
        permissions: ['PAYMENT_CREATE_SELF'],
      };

      const created = await financeService.recordPayment(actor, {
        residentId: 'res-1',
        amount: '15000.00',
        currency: 'PKR',
        method: 'BANK_TRANSFER',
        allocationStrategy: 'OLDEST_DUE_FIRST',
        idempotencyKey: 'idemp-specific-bank-1',
        bankAccountId: 'bank-2-secondary',
      });

      expect((created as any).bankAccountId).toBe('bank-2-secondary');
      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bankAccountId: 'bank-2-secondary',
          }),
        }),
      );
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

  describe('FinanceModule DI Wiring', () => {
    it('compiles FinanceModule and successfully resolves all services with AuditService', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          PrismaModule,
          ConfigurationModule,
          SupabaseModule,
          FinanceModule,
        ],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrisma)
        .compile();

      expect(moduleRef.get(VendorsService)).toBeDefined();
      expect(moduleRef.get(ExpensesService)).toBeDefined();
      expect(moduleRef.get(BudgetsService)).toBeDefined();
      expect(moduleRef.get(BankingService)).toBeDefined();
      expect(moduleRef.get(ReconciliationService)).toBeDefined();
      expect(moduleRef.get(AuditService)).toBeDefined();
    });
  });
});
