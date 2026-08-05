import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class TicketQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 25;
  @IsOptional()
  @Transform(({ value }) => String(value).trim())
  @MaxLength(160)
  search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional()
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY'])
  priority?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional()
  @IsIn(['STANDARD', 'RESTRICTED', 'CONFIDENTIAL'])
  privacy?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  overdue?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  escalated?: boolean;
}

export class TicketCategoryDto {
  @IsString() @Length(2, 120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsUUID() workerCategoryId?: string;
  @IsOptional() @IsUUID() requiredSkillId?: string;
}

export class ComplaintSubmissionDto {
  @IsUUID() categoryId!: string;
  @IsString() @Length(3, 180) subject!: string;
  @IsString() @Length(10, 10000) description!: string;
  @IsOptional() @IsString() @MaxLength(300) location?: string;
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY']) urgency = 'NORMAL';
  @IsIn(['STANDARD', 'RESTRICTED', 'CONFIDENTIAL']) privacy = 'STANDARD';
  @IsOptional()
  @IsIn(['EMAIL', 'PHONE', 'IN_APP'])
  preferredContactMethod?: string;
}

export class MaintenanceSubmissionDto {
  @IsUUID() categoryId!: string;
  @IsString() @Length(3, 180) subject!: string;
  @IsString() @Length(10, 10000) description!: string;
  @IsString() @Length(2, 300) exactLocation!: string;
  @IsOptional() @IsDateString() preferredVisitDate?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  preferredStartMinute?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  preferredEndMinute?: number;
  @IsOptional() @IsString() @MaxLength(1000) accessInstructions?: string;
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY']) urgency = 'NORMAL';
  @IsOptional()
  @IsIn(['EMAIL', 'PHONE', 'IN_APP'])
  preferredContactMethod?: string;
  @IsBoolean() contactDisclosureConsent = false;
}

export class TicketTransitionDto {
  @IsString() @Length(3, 1000) reason!: string;
  @IsOptional() @IsString() @MaxLength(1000) residentExplanation?: string;
  @Type(() => Number) @IsInt() @Min(0) version!: number;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  overrideReopenWindow?: boolean;
}

export class PriorityDto {
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY']) priority!: string;
  @Type(() => Number) @IsInt() @Min(0) version!: number;
}
export class AdminAssignmentDto {
  @IsUUID() administratorUserId!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
export class TicketMessageDto {
  @IsString() @Length(1, 4000) body!: string;
  @IsIn(['RESIDENT_VISIBLE', 'INTERNAL', 'WORKER_OPERATIONAL']) visibility =
    'RESIDENT_VISIBLE';
}
export class WorkerAssignmentDto {
  @IsUUID() workerId!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsString() @Length(3, 500) reason!: string;
}
export class AppointmentDto {
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() @MaxLength(1000) accessInstructions?: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) version?: number;
}
export class ResolutionDto {
  @IsString() @Length(3, 4000) workPerformed!: string;
  @IsString() @Length(3, 2000) residentSummary!: string;
  @IsOptional() @IsString() @MaxLength(2000) partsNotes?: string;
  @IsOptional() @IsString() @MaxLength(2000) internalNotes?: string;
  @IsOptional() @IsString() @MaxLength(1000) followUpRecommendation?: string;
}
export class RatingDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(5) overall!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) serviceQuality!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) timeliness!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) professionalBehaviour!: number;
  @IsOptional() @IsString() @MaxLength(1000) comments?: string;
  @IsOptional() @IsString() @MaxLength(1000) confidentialComments?: string;
}
export class ServiceLevelDto {
  @IsIn(['COMPLAINT', 'MAINTENANCE']) ticketType!: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY']) priority!: string;
  @Type(() => Number) @IsInt() @Min(1) responseMinutes!: number;
  @Type(() => Number) @IsInt() @Min(1) resolutionMinutes!: number;
  @IsString() @Length(2, 80) escalationRoleCode!: string;
}
