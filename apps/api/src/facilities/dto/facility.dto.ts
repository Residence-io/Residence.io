import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsISO8601,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FacilityStatus,
  FacilityBookingStatus,
} from '../../generated/prisma/client';

export class CreateFacilityDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(FacilityStatus)
  status?: FacilityStatus;

  @IsOptional()
  @Matches(/^([01]\\d|2[0-3]):[0-5]\\d$/, {
    message: 'openingTime must be in HH:mm format',
  })
  openingTime?: string;

  @IsOptional()
  @Matches(/^([01]\\d|2[0-3]):[0-5]\\d$/, {
    message: 'closingTime must be in HH:mm format',
  })
  closingTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(1440)
  bookingDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  advanceBookingDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsString()
  imageObjectKey?: string;
}

export class UpdateFacilityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(FacilityStatus)
  status?: FacilityStatus;

  @IsOptional()
  @Matches(/^([01]\\d|2[0-3]):[0-5]\\d$/, {
    message: 'openingTime must be in HH:mm format',
  })
  openingTime?: string;

  @IsOptional()
  @Matches(/^([01]\\d|2[0-3]):[0-5]\\d$/, {
    message: 'closingTime must be in HH:mm format',
  })
  closingTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(1440)
  bookingDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  advanceBookingDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsString()
  imageObjectKey?: string;
}

export class CreateBlockoutDto {
  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsString()
  reason!: string;
}

export class CreateBookingDto {
  @IsString()
  facilityId!: string;

  @IsISO8601()
  bookingDate!: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectBookingDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class QueryBookingsDto {
  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsEnum(FacilityBookingStatus)
  status?: FacilityBookingStatus;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
