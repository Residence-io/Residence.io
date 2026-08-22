import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AssetStatus,
  AssetCondition,
  AssetCategory,
} from '../../generated/prisma/client';

export class CreateAssetDto {
  @IsString()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AssetCategory)
  category: AssetCategory;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchaseCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  assignedWorkerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchaseCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  assignedWorkerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssetStatusDto {
  @IsEnum(AssetStatus)
  status: AssetStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AttachAssetDocumentDto {
  @IsString()
  @MaxLength(500)
  objectKey: string;

  @IsString()
  @MaxLength(255)
  originalName: string;

  @IsString()
  @MaxLength(120)
  mediaType: string;

  @IsNumber()
  @Type(() => Number)
  sizeBytes: number;

  @IsString()
  @MaxLength(64)
  checksumSha256: string;

  @IsString()
  @MaxLength(80)
  category: string;
}
