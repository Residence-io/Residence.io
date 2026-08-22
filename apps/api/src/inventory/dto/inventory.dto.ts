import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryMovementType } from '../../generated/prisma/client';

export class CreateInventoryItemDto {
  @IsString()
  @MaxLength(50)
  sku: string;

  @IsString()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsString()
  @MaxLength(30)
  unitOfMeasure: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reorderLevel?: number;

  @IsOptional()
  @IsString()
  defaultVendorId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unitOfMeasure?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reorderLevel?: number;

  @IsOptional()
  @IsString()
  defaultVendorId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordMovementDto {
  @IsEnum(InventoryMovementType)
  type: InventoryMovementType;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  maintenanceRequestId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
