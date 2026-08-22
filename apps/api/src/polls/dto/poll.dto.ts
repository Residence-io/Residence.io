import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PollType, PollEligibility } from '../../generated/prisma/client';

export class CreatePollOptionDto {
  @IsString()
  @MaxLength(200)
  label: string;

  @IsOptional()
  sortOrder?: number;
}

export class CreatePollDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PollType)
  type: PollType;

  @IsDateString()
  opensAt: string;

  @IsDateString()
  closesAt: string;

  @IsOptional()
  @IsEnum(PollEligibility)
  eligibility?: PollEligibility;

  @IsOptional()
  @IsBoolean()
  allowMultiple?: boolean;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreatePollOptionDto)
  options: CreatePollOptionDto[];
}

export class UpdatePollDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  opensAt?: string;

  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @IsOptional()
  @IsEnum(PollEligibility)
  eligibility?: PollEligibility;

  @IsOptional()
  @IsBoolean()
  allowMultiple?: boolean;
}

export class CastVoteDto {
  @IsOptional()
  @IsString()
  optionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionIds?: string[];
}
