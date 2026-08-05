import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export const SETTINGS_SECTIONS = [
  'society',
  'residents',
  'maintenance',
  'notifications',
  'security',
] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export class SettingsSectionDto {
  @IsObject()
  data!: Record<string, unknown>;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  version!: number;
}

export class FinancialSettingsDto {
  @IsNumberString({ no_symbols: true })
  defaultMonthlyFee!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  gracePeriodDays!: number;

  @IsObject()
  lateFeePolicy!: Record<string, unknown>;

  @IsIn([
    'OLDEST_DUE_FIRST',
    'SELECTED_DUES',
    'CURRENT_MONTH',
    'ALL_OUTSTANDING',
    'ADVANCE',
  ])
  allocationStrategy!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  receiptPrefix!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  receiptSequenceStart!: number;

  @IsOptional()
  @IsString()
  paymentInstructions?: string;

  @IsArray()
  @IsString({ each: true })
  supportedPaymentMethods!: string[];

  @IsOptional()
  @IsString()
  bankTransferInstructions?: string;

  @IsObject()
  advancePaymentPolicy!: Record<string, unknown>;

  @IsObject()
  refundAndReversalPolicy!: Record<string, unknown>;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  roundingScale!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class ArchiveSettingDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 500)
  reason!: string;
}
