import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import {
  ResidentRequestType,
  CommunityEventType,
  CommunityEventStatus,
  CommunityEventVisibility,
  OccupancyType,
  ResidentDocumentCategory,
} from '../../generated/prisma/client';

export class UploadResidentDocumentDto {
  @IsEnum(ResidentDocumentCategory)
  category!: ResidentDocumentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  documentNumber?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ReviewResidentDocumentDto {
  @IsEnum(['VERIFIED', 'REJECTED'])
  status!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class CreateResidentRequestDto {
  @IsEnum(ResidentRequestType)
  requestType!: ResidentRequestType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ReviewResidentRequestDto {
  @IsEnum(['APPROVED', 'REJECTED', 'UNDER_REVIEW'])
  status!: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class IssueResidentRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  issuedDocumentObjectKey?: string;
}

export class CreateMoveInRequestDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  unitId!: string;

  @IsEnum(OccupancyType)
  occupancyType!: OccupancyType;

  @IsDateString()
  desiredMoveInDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ReviewMoveInRequestDto {
  @IsEnum(['APPROVED', 'REJECTED', 'UNDER_REVIEW'])
  status!: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class CreateMoveOutRequestDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  unitId!: string;

  @IsDateString()
  desiredMoveOutDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewMoveOutRequestDto {
  @IsEnum(['APPROVED', 'REJECTED', 'UNDER_REVIEW'])
  status!: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class UpdateMoveOutClearanceDto {
  @IsOptional()
  @IsEnum(['PENDING', 'CLEARED', 'BLOCKED'])
  duesClearanceStatus?: 'PENDING' | 'CLEARED' | 'BLOCKED';

  @IsOptional()
  @IsEnum(['PENDING', 'CLEARED', 'BLOCKED'])
  parkingClearanceStatus?: 'PENDING' | 'CLEARED' | 'BLOCKED';
}

export class CreateCommunityEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CommunityEventType)
  eventType!: CommunityEventType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsEnum(CommunityEventVisibility)
  visibility?: CommunityEventVisibility;
}

export class UpdateCommunityEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CommunityEventType)
  eventType?: CommunityEventType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsEnum(CommunityEventStatus)
  status?: CommunityEventStatus;

  @IsOptional()
  @IsEnum(CommunityEventVisibility)
  visibility?: CommunityEventVisibility;
}

export class CreateEmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  alternatePhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEmergencyContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  alternatePhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
