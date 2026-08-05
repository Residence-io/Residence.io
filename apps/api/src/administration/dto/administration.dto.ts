import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 25;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() block?: string;
  @IsOptional() @IsUUID() actorId?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() entity?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class DashboardPeriodDto {
  @IsOptional() @IsIn(['month', '6m', '12m']) period = '6m';
}

export class UserStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']) status!: string;
  @IsString() @IsNotEmpty() @Length(3, 500) reason!: string;
  @Type(() => Number) @IsInt() @Min(0) version!: number;
}

export class AssignRolesDto {
  @IsArray() @IsUUID(undefined, { each: true }) roleIds!: string[];
  @IsString() @IsNotEmpty() @Length(3, 500) reason!: string;
  @Type(() => Number) @IsInt() @Min(0) version!: number;
}

export class RolePermissionsDto {
  @IsArray() @IsUUID(undefined, { each: true }) permissionIds!: string[];
  @IsString() @IsNotEmpty() @Length(3, 500) reason!: string;
  @Type(() => Number) @IsInt() @Min(0) version!: number;
}

export class ReasonDto {
  @IsString() @IsNotEmpty() @Length(3, 500) reason!: string;
}

export class CorrectionRequestDto {
  @IsIn(['IDENTITY', 'TENANCY', 'OCCUPANCY', 'OTHER']) requestType!: string;
  @IsObject() requestedChanges!: Record<string, unknown>;
  @IsString() @IsNotEmpty() @Length(10, 1000) reason!: string;
}

export class ResolveCorrectionDto extends ReasonDto {
  @IsIn(['APPROVED', 'REJECTED']) status!: string;
}
