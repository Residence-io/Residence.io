import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AnnouncementStatus,
  AudienceType,
  DeliveryStatus,
  NotificationChannel,
  NotificationPriority,
} from '../../generated/prisma/client';

export class PageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 25;
  @IsOptional() @IsString() @MaxLength(120) search?: string;
}
export class TemplateDto {
  @IsString() @Length(2, 160) name!: string;
  @IsString() @Length(2, 120) notificationType!: string;
  @IsEnum(NotificationChannel) channel!: NotificationChannel;
  @IsOptional() @IsString() @MaxLength(16) language = 'en';
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  allowedVariables!: string[];
  @IsOptional() @IsString() @MaxLength(300) subjectTemplate?: string;
  @IsString() @Length(1, 20_000) messageTemplate!: string;
}
export class TemplatePreviewDto {
  @IsOptional() @IsString() @MaxLength(300) subject = '';
  @IsString() @MaxLength(20_000) message!: string;
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  allowedVariables!: string[];
  @IsObject() values!: Record<string, string | number>;
  @IsOptional() @IsBoolean() html = false;
}
export class PreferenceDto {
  @IsBoolean() emailEnabled!: boolean;
  @IsBoolean() smsEnabled!: boolean;
  @IsBoolean() inAppEnabled!: boolean;
  @IsBoolean() paymentReminders!: boolean;
  @IsBoolean() generalAnnouncements!: boolean;
  @IsBoolean() maintenanceUpdates!: boolean;
  @IsBoolean() complaintUpdates!: boolean;
  @IsBoolean() optionalEvents!: boolean;
  @IsString() @MaxLength(16) preferredLanguage!: string;
  @IsOptional() @IsInt() @Min(0) @Max(23) quietHoursStart?: number;
  @IsOptional() @IsInt() @Min(0) @Max(23) quietHoursEnd?: number;
}
export class ComposeDto {
  @IsString() @Length(2, 120) notificationType!: string;
  @IsString() @Length(1, 300) subject!: string;
  @IsString() @Length(1, 20_000) message!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsEnum(NotificationChannel, { each: true })
  channels!: NotificationChannel[];
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @IsUUID('4', { each: true })
  userIds!: string[];
  @IsOptional() @IsEnum(NotificationPriority) priority =
    NotificationPriority.NORMAL;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsString() @Length(8, 180) idempotencyKey!: string;
}
export class AnnouncementDto {
  @IsString() @Length(2, 300) subject!: string;
  @IsString() @Length(2, 20_000) message!: string;
  @IsString() @Length(2, 80) category!: string;
  @IsEnum(NotificationPriority) priority = NotificationPriority.NORMAL;
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels!: NotificationChannel[];
  @IsEnum(AudienceType) audienceType!: AudienceType;
  @IsObject() audienceCriteria: Record<string, unknown> = {};
  @IsOptional() @IsDateString() publishAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsBoolean() requiresAcknowledgment = false;
  @IsBoolean() emergency = false;
  @IsString() @Length(8, 180) idempotencyKey!: string;
}
export class DeliveryQueryDto extends PageDto {
  @IsOptional() @IsEnum(NotificationChannel) channel?: NotificationChannel;
  @IsOptional() @IsEnum(DeliveryStatus) status?: DeliveryStatus;
}
export class AnnouncementQueryDto extends PageDto {
  @IsOptional() @IsEnum(AnnouncementStatus) status?: AnnouncementStatus;
}
export class CallbackDto {
  @IsString() @Length(4, 180) callbackId!: string;
  @IsString() @Length(4, 180) providerReference!: string;
  @IsEnum(DeliveryStatus) status!: DeliveryStatus;
}
export class ReminderPreviewDto {
  @IsOptional() @IsDateString() dueFrom?: string;
  @IsOptional() @IsDateString() dueTo?: string;
  @IsOptional() @IsString() @MaxLength(80) block?: string;
  @IsOptional() @IsString() @MaxLength(120) unit?: string;
  @IsOptional() @Type(() => Number) @Min(0) minimumOutstanding?: number;
}
