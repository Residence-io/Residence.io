import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const phonePattern = /^\+?[0-9][0-9 ()-]{6,24}$/;
const platePattern = /^[A-Za-z0-9][A-Za-z0-9 -]{2,19}$/;

export class AccountProvisionDto {
  @IsBoolean() createAccount = false;
  @ValidateIf((value: AccountProvisionDto) => value.createAccount)
  @IsString()
  @Length(3, 100)
  @Matches(/^[A-Za-z0-9._-]+$/)
  username?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() active = true;
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  temporaryPassword?: string;
}

export class ProvisionAccountDto {
  @IsString()
  @Length(3, 100)
  @Matches(/^[A-Za-z0-9._-]+$/)
  username!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() active = true;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(200) temporaryPassword?: string;
}

export class SetTemporaryPasswordDto {
  @IsString() @MinLength(8) @MaxLength(200) temporaryPassword!: string;
  @IsString() @Length(3, 500) reason!: string;
}

export class HouseholdMemberDto {
  @IsString() @Length(2, 160) fullName!: string;
  @IsString() @Length(2, 80) relationship!: string;
  @IsOptional() @IsInt() @Min(0) @Max(120) age?: number;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsIn(['FEMALE', 'MALE', 'OTHER', 'UNDISCLOSED']) gender =
    'UNDISCLOSED';
  @IsOptional() @Matches(phonePattern) phone?: string;
  @IsOptional()
  @Matches(/^[A-Za-z0-9-]{4,40}$/)
  identityDocumentNumber?: string;
  @IsOptional() @IsBoolean() emergencyContact = false;
}


export class HouseholdMemberRemoveDto {
  @IsInt() @Min(0) version!: number;
}

export class HouseholdMemberUpdateDto {
  @IsInt() @Min(0) version!: number;
  @IsOptional() @IsString() @Length(2, 160) fullName?: string;
  @IsOptional() @IsString() @Length(2, 80) relationship?: string;
  @IsOptional() @IsInt() @Min(0) @Max(120) age?: number;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsIn(['FEMALE', 'MALE', 'OTHER', 'UNDISCLOSED']) gender?: string;
  @IsOptional() @Matches(phonePattern) phone?: string;
  @IsOptional() @IsBoolean() emergencyContact?: boolean;
}

export class VehicleDto {
  @IsString() @Length(2, 80) type!: string;
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(100) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(100) model?: string;
  @IsOptional() @IsString() @MaxLength(60) colour?: string;
  @Matches(platePattern) registrationNumber!: string;
  @IsOptional() @IsString() @MaxLength(80) parkingPermitNumber?: string;
  @IsOptional() @IsString() @MaxLength(160) parkingLocation?: string;
}

export class CreateResidentDto {
  @IsString() @Length(2, 160) fullName!: string;
  @IsOptional() @IsString() @MaxLength(160) guardianName?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsIn(['FEMALE', 'MALE', 'OTHER', 'UNDISCLOSED']) gender =
    'UNDISCLOSED';
  @IsOptional() @IsEmail() email?: string;
  @Matches(phonePattern) primaryPhone!: string;
  @IsOptional() @Matches(phonePattern) alternatePhone?: string;
  @IsOptional()
  @Matches(/^[A-Za-z0-9-]{4,40}$/)
  identityDocumentNumber?: string;
  @IsOptional() @IsString() @MaxLength(500) permanentAddress?: string;
  @IsOptional() @IsString() @MaxLength(160) emergencyContactName?: string;
  @IsOptional() @Matches(phonePattern) emergencyContactPhone?: string;
  @IsInt() @Min(1) @Max(100) householdSize = 1;

  @IsUUID() unitId!: string;
  @IsIn(['OWNER', 'TENANT']) occupancyType!: 'OWNER' | 'TENANT';
  @IsDateString() moveInDate!: string;
  @ValidateIf((value: CreateResidentDto) => value.occupancyType === 'TENANT')
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  propertyOwnerName?: string;
  @ValidateIf((value: CreateResidentDto) => value.occupancyType === 'TENANT')
  @Matches(phonePattern)
  propertyOwnerPhone?: string;
  @IsOptional() @IsEmail() propertyOwnerEmail?: string;
  @ValidateIf((value: CreateResidentDto) => value.occupancyType === 'TENANT')
  @IsDateString()
  tenancyStartDate?: string;
  @ValidateIf((value: CreateResidentDto) => value.occupancyType === 'TENANT')
  @IsDateString()
  tenancyEndDate?: string;

  @Matches(/^\d{1,15}(\.\d{1,4})?$/) monthlyFee!: string;
  @IsOptional() @Matches(/^\d{1,15}(\.\d{1,4})?$/) securityDeposit?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountProvisionDto)
  account?: AccountProvisionDto;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => HouseholdMemberDto)
  householdMembers: HouseholdMemberDto[] = [];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => VehicleDto)
  vehicles: VehicleDto[] = [];
}

export class ResidentQueryDto {
  @IsOptional() @IsString() @MaxLength(160) search?: string;
  @IsOptional() @IsIn(['OWNER', 'TENANT']) occupancyType?: 'OWNER' | 'TENANT';
  @IsOptional()
  @IsIn(['ALL', 'ACTIVE', 'SUSPENDED', 'MOVED_OUT', 'INACTIVE', 'ARCHIVED', 'PREVIOUS'])
  status?: string;
  @IsOptional() @IsString() @MaxLength(80) block?: string;
  @IsOptional()
  @IsIn(['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'OTHER'])
  propertyType?: string;
  @IsOptional() @IsDateString() moveInFrom?: string;
  @IsOptional() @IsDateString() moveInTo?: string;
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{4,40}$/)
  identityNumber?: string;
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional()
  @IsIn(['residentNumber', 'fullName', 'createdAt', 'moveInDate'])
  sort = 'residentNumber';
  @IsOptional() @IsIn(['asc', 'desc']) direction: 'asc' | 'desc' = 'asc';
}

export class UpdateResidentDto {
  @IsInt() @Min(0) version!: number;
  @IsOptional() @IsString() @Length(2, 160) fullName?: string;
  @IsOptional() @IsString() @MaxLength(160) guardianName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @Matches(phonePattern) primaryPhone?: string;
  @IsOptional() @Matches(phonePattern) alternatePhone?: string;
  @IsOptional() @IsString() @MaxLength(500) permanentAddress?: string;
  @IsOptional() @IsString() @MaxLength(160) emergencyContactName?: string;
  @IsOptional() @Matches(phonePattern) emergencyContactPhone?: string;
}

export class LifecycleDto {
  @IsString() @Length(3, 500) reason!: string;
  @IsOptional() @IsDateString() effectiveDate?: string;
}

export class MoveOutDto extends LifecycleDto {
  @IsDateString() moveOutDate!: string;
}

export class UpdateRelatedDto {
  @IsInt() @Min(0) version!: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsDateString() movedOutAt?: string;
}
