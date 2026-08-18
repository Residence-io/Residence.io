import { Type } from 'class-transformer';
import {
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

export class CreatePropertyDto {
  @IsString() @Length(1, 80) block!: string;
  @IsOptional() @IsString() @MaxLength(160) street?: string;
  @IsString() @Length(1, 80) propertyNumber!: string;
  @IsIn(['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'OTHER']) type!:
    | 'HOUSE'
    | 'APARTMENT'
    | 'PLOT'
    | 'COMMERCIAL'
    | 'OTHER';
}

export class CreateUnitDto {
  @IsUUID() propertyId!: string;
  @IsString() @Length(1, 80) unitNumber!: string;
  @IsOptional() @IsString() @MaxLength(300) parkingInformation?: string;
}

export class PropertyQueryDto {
  @IsOptional() @IsString() @MaxLength(160) search?: string;
  @IsOptional() @IsString() @MaxLength(80) block?: string;
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
