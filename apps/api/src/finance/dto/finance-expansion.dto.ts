import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  VendorStatus,
  VendorCategory,
  ExpenseStatus,
  ExpenseCategory,
  BudgetStatus,
  PaymentMethod,
} from '../../generated/prisma/client';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  taxNumber?: string;

  @IsOptional()
  @IsEnum(VendorCategory)
  category?: VendorCategory;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  taxNumber?: string;

  @IsOptional()
  @IsEnum(VendorCategory)
  category?: VendorCategory;

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateExpenseDto {
  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsDateString()
  expenseDate!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  invoiceObjectKey?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewExpenseDto {
  @IsEnum(ExpenseStatus)
  status!: ExpenseStatus; // APPROVED or REJECTED

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class PayExpenseDto {
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BudgetLineDto {
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsNumber()
  @Min(0)
  plannedAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  financialYear!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines!: BudgetLineDto[];
}

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines?: BudgetLineDto[];
}

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  accountTitle!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  accountNumberMasked!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  iban?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  branchCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  depositInstructions?: string;
}

export class UpdateBankAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  accountTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  accountNumberMasked?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  iban?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  branchCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  depositInstructions?: string;
}

export class MatchBankStatementLineDto {
  @IsString()
  @IsNotEmpty()
  matchedEntityType!: string; // 'PAYMENT' | 'EXPENSE'

  @IsString()
  @IsNotEmpty()
  matchedEntityId!: string;
}

export class CreateReconciliationDto {
  @IsString()
  @IsNotEmpty()
  bankAccountId!: string;

  @IsDateString()
  reconciliationDate!: string;

  @IsNumber()
  statementBalance!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
