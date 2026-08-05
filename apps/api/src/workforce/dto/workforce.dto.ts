import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
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

const money = /^\d{1,16}(\.\d{1,2})?$/;
const phone = /^\+?[0-9][0-9 ()-]{6,28}$/;

export class WorkforceQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 25;
  @IsOptional()
  @Transform(({ value }) => String(value).trim())
  @MaxLength(120)
  search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() jobTitleId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() skillId?: string;
  @IsOptional() @IsString() serviceArea?: string;
  @IsOptional()
  @IsIn(['INTERNAL', 'EXTERNAL_CONTRACTOR'])
  relationship?: string;
}

export class DepartmentDto {
  @IsString() @Length(2, 120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) displayOrder = 0;
  @IsOptional() @IsBoolean() active = true;
}

export class JobTitleDto extends DepartmentDto {
  @IsUUID() departmentId!: string;
}

export class StaffDto {
  @IsString() @Length(2, 160) fullName!: string;
  @IsOptional() @IsString() @MaxLength(160) guardianName?: string;
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{5,40}$/)
  identityNumber?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsIn(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']) gender =
    'UNDISCLOSED';
  @IsOptional() @IsEmail() email?: string;
  @Matches(phone) primaryPhone!: string;
  @IsOptional() @Matches(phone) alternatePhone?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(160) emergencyContactName?: string;
  @IsOptional() @Matches(phone) emergencyContactPhone?: string;
  @IsUUID() departmentId!: string;
  @IsUUID() jobTitleId!: string;
  @IsOptional() @IsUUID() supervisorStaffId?: string;
  @IsIn([
    'PERMANENT',
    'CONTRACT',
    'PART_TIME',
    'TEMPORARY',
    'DAILY_WAGE',
    'OTHER',
  ])
  employmentType!: string;
  @IsDateString() joiningDate!: string;
  @IsOptional() @IsDateString() probationEndDate?: string;
  @IsOptional() @IsString() @MaxLength(100) workShift?: string;
  @IsOptional()
  @IsIn(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'DIGITAL_TRANSFER', 'OTHER'])
  paymentMethod?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class LifecycleDto {
  @IsString() @Length(3, 500) reason!: string;
  @IsDateString() effectiveAt!: string;
  @Type(() => Number) @IsInt() @Min(0) version!: number;
}

export class SalaryStructureDto {
  @IsUUID() staffId!: string;
  @Matches(money) basicSalary!: string;
  @Matches(money) fixedAllowances = '0';
  @Matches(money) fixedDeductions = '0';
  @IsIn(['MONTHLY', 'WEEKLY', 'DAILY']) frequency = 'MONTHLY';
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsDateString() effectiveFrom!: string;
  @IsOptional() @IsDateString() effectiveTo?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class SalaryPeriodDto {
  @Type(() => Number) @IsInt() @Min(2000) @Max(2200) year!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) month!: number;
}

export class SalaryPaymentDto {
  @Matches(money) amount!: string;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsIn(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'DIGITAL_TRANSFER', 'OTHER'])
  method!: string;
  @IsOptional() @IsDateString() paymentDate?: string;
  @IsOptional() @IsString() @MaxLength(180) transactionReference?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsString() @Length(8, 180) idempotencyKey!: string;
}

export class SalaryAdjustmentDto {
  @IsIn(['ALLOWANCE', 'DEDUCTION', 'DEBIT_CORRECTION', 'CREDIT_CORRECTION'])
  type!: string;
  @Matches(money) amount!: string;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 180) idempotencyKey!: string;
}

export class SalaryReversalDto {
  @Matches(money) amount!: string;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 180) idempotencyKey!: string;
}

export class WorkerCategoryDto {
  @IsString() @Matches(/^[A-Z0-9_]{2,30}$/) code!: string;
  @IsString() @Length(2, 120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  defaultDurationMinutes?: number;
  @IsOptional() @Matches(money) defaultRate?: string;
  @ValidateIf((o: WorkerCategoryDto) => Boolean(o.defaultRate))
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
}

export class WorkerSkillDto {
  @IsString() @Length(2, 120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class ContractorCompanyDto {
  @IsString() @Length(2, 160) name!: string;
  @IsOptional() @IsString() @MaxLength(160) contactName?: string;
  @IsOptional() @Matches(phone) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
}

export class WorkerDto {
  @IsString() @Length(2, 160) fullName!: string;
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{5,40}$/)
  identityNumber?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @Matches(phone) primaryPhone!: string;
  @IsOptional() @Matches(phone) alternatePhone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(200) emergencyContact?: string;
  @IsUUID() primaryCategoryId!: string;
  @IsArray() @ArrayMaxSize(30) @IsUUID('4', { each: true }) skillIds!: string[];
  @IsIn(['INTERNAL', 'EXTERNAL_CONTRACTOR']) relationship!: string;
  @ValidateIf((o: WorkerDto) => o.relationship === 'EXTERNAL_CONTRACTOR')
  @IsUUID()
  contractorCompanyId?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(80) experienceYears = 0;
  @IsString() @Length(2, 160) serviceArea!: string;
  @IsOptional() @IsString() @MaxLength(500) rateNotes?: string;
  @IsDateString() registrationDate!: string;
  @IsOptional() @IsString() @MaxLength(1000) administrativeNotes?: string;
}

export class AvailabilityDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(6) dayOfWeek!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(1439) startMinute!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(1440) endMinute!: number;
  @IsOptional() @IsString() @MaxLength(160) serviceArea?: string;
}

export class OverrideDto {
  @IsIn(['AVAILABLE', 'UNAVAILABLE', 'LEAVE']) type!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsString() @Length(3, 500) reason!: string;
}

export class ReservationDto {
  @IsUUID() workerId!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() @MaxLength(160) serviceArea?: string;
  @IsString() @Length(3, 300) purpose!: string;
}

export class EligibilityDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() skillId?: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() @MaxLength(160) serviceArea?: string;
}

export class PerformanceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  reliability?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  workQuality?: number;
  @IsString() @Length(3, 1000) note!: string;
  @IsDateString() reviewDate!: string;
}
