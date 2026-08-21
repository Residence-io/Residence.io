import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
const moneyPattern = /^\d{1,16}(\.\d{1,2})?$/;
export class CreateFeePlanDto {
  @IsString() @Length(2, 160) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsIn(['SOCIETY_DEFAULT', 'PROPERTY_TYPE', 'UNIT']) scope!:
    'SOCIETY_DEFAULT' | 'PROPERTY_TYPE' | 'UNIT';
  @ValidateIf((o: CreateFeePlanDto) => o.scope === 'UNIT')
  @IsUUID()
  unitId?: string;
  @ValidateIf((o: CreateFeePlanDto) => o.scope === 'PROPERTY_TYPE')
  @IsIn(['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'OTHER'])
  propertyType?: string;
  @Matches(moneyPattern) monthlyBaseAmount!: string;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsDateString() effectiveFrom!: string;
  @IsOptional() @IsDateString() effectiveTo?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(28) dueDay = 10;
  @Type(() => Number) @IsInt() @Min(0) @Max(60) gracePeriodDays = 0;
  @IsIn(['NONE', 'FIXED', 'PERCENTAGE']) lateFeeType:
    'NONE' | 'FIXED' | 'PERCENTAGE' = 'NONE';
  @Matches(moneyPattern) lateFeeValue = '0';
  @IsBoolean() lateFeeRecurring = false;
}
export class PeriodDto {
  @Type(() => Number) @IsInt() @Min(2000) @Max(2200) year!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) month!: number;
}
export class GenerateDuesDto extends PeriodDto {
  @IsString() @Length(8, 180) idempotencyKey!: string;
}
export class AssignFeePlanDto {
  @IsUUID() residentId!: string;
  @IsUUID() feePlanId!: string;
  @IsDateString() effectiveFrom!: string;
  @IsOptional() @IsDateString() effectiveTo?: string;
  @IsString() @Length(3, 500) reason!: string;
}
export class PaymentDto {
  @IsUUID() residentId!: string;
  @Matches(moneyPattern) amount!: string;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsIn([
    'CASH',
    'BANK_TRANSFER',
    'CARD_PROVIDER',
    'DIGITAL_WALLET',
    'CHEQUE',
    'OTHER',
  ])
  method!: string;
  @IsIn([
    'OLDEST_DUE_FIRST',
    'SELECTED_DUES',
    'CURRENT_MONTH',
    'ALL_OUTSTANDING',
    'ADVANCE',
  ])
  allocationStrategy = 'OLDEST_DUE_FIRST';
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(36)
  @IsUUID('4', { each: true })
  selectedDueIds?: string[];
  @IsOptional() @IsString() @MaxLength(180) transactionReference?: string;
  @IsString() @Length(8, 180) idempotencyKey!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsOptional() @IsDateString() paymentDate?: string;
  @IsOptional() @IsUUID() bankAccountId?: string;
}
export class ResidentPaymentDto {
  @Matches(moneyPattern) amount!: string;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsIn(['BANK_TRANSFER', 'CARD_PROVIDER', 'DIGITAL_WALLET']) method!: string;
  @IsIn([
    'OLDEST_DUE_FIRST',
    'SELECTED_DUES',
    'CURRENT_MONTH',
    'ALL_OUTSTANDING',
    'ADVANCE',
  ])
  allocationStrategy = 'OLDEST_DUE_FIRST';
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(36)
  @IsUUID('4', { each: true })
  selectedDueIds?: string[];
  @IsString() @Length(8, 180) idempotencyKey!: string;
  @IsOptional() @IsUUID() bankAccountId?: string;
}
export class DecisionDto {
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 180) idempotencyKey!: string;
}
export class AdjustmentDto extends DecisionDto {
  @IsIn([
    'FIXED_DISCOUNT',
    'PERCENTAGE_DISCOUNT',
    'PARTIAL_WAIVER',
    'FULL_WAIVER',
    'DEBIT_ADJUSTMENT',
    'CREDIT_ADJUSTMENT',
    'CORRECTION',
  ])
  type!: string;
  @Matches(moneyPattern) amount!: string;
}
export class RefundDto extends DecisionDto {
  @Matches(moneyPattern) amount!: string;
}
export class FinanceQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 25;
  @IsOptional()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MaxLength(120)
  search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsUUID() residentId?: string;
}
