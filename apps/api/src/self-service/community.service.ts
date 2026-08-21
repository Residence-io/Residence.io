import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateCommunityEventDto,
  UpdateCommunityEventDto,
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
} from './dto/self-service.dto';
import {
  CommunityEventStatus,
  CommunityEventVisibility,
} from '../generated/prisma/client';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ==================== EVENTS ====================

  async getEvents(societyId: string, visibility?: CommunityEventVisibility) {
    return this.prisma.communityEvent.findMany({
      where: {
        societyId,
        status: { not: CommunityEventStatus.CANCELLED },
        ...(visibility
          ? {
              visibility: {
                in: [CommunityEventVisibility.ALL_RESIDENTS, visibility],
              },
            }
          : {}),
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async getAllEventsAdmin(societyId: string) {
    return this.prisma.communityEvent.findMany({
      where: { societyId },
      orderBy: { startsAt: 'desc' },
    });
  }

  async createEvent(
    societyId: string,
    userId: string,
    dto: CreateCommunityEventDto,
  ) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('Event end time must be after start time.');
    }

    const event = await this.prisma.communityEvent.create({
      data: {
        societyId,
        title: dto.title,
        description: dto.description || null,
        eventType: dto.eventType,
        location: dto.location || null,
        startsAt,
        endsAt,
        allDay: dto.allDay || false,
        visibility: dto.visibility || CommunityEventVisibility.ALL_RESIDENTS,
        createdByUserId: userId,
        status: CommunityEventStatus.SCHEDULED,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'COMMUNITY_EVENT_CREATED',
      targetType: 'CommunityEvent',
      targetId: event.id,
      outcome: 'SUCCESS',
      safeMetadata: { title: dto.title, eventType: dto.eventType },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'COMMUNITY_EVENT_PUBLISHED',
      targetType: 'CommunityEvent',
      targetId: event.id,
      outcome: 'SUCCESS',
      safeMetadata: { title: dto.title },
    });

    return event;
  }

  async updateEvent(
    societyId: string,
    userId: string,
    id: string,
    dto: UpdateCommunityEventDto,
  ) {
    const existing = await this.prisma.communityEvent.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException('Community event not found.');
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;

    if (endsAt <= startsAt) {
      throw new BadRequestException('Event end time must be after start time.');
    }

    const updated = await this.prisma.communityEvent.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.eventType ? { eventType: dto.eventType } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.startsAt ? { startsAt } : {}),
        ...(dto.endsAt ? { endsAt } : {}),
        ...(dto.allDay !== undefined ? { allDay: dto.allDay } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.visibility ? { visibility: dto.visibility } : {}),
      },
    });

    const isCancelled = dto.status === CommunityEventStatus.CANCELLED;

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: isCancelled
        ? 'COMMUNITY_EVENT_CANCELLED'
        : 'COMMUNITY_EVENT_UPDATED',
      targetType: 'CommunityEvent',
      targetId: id,
      outcome: 'SUCCESS',
      safeMetadata: { title: updated.title, status: updated.status },
    });

    return updated;
  }

  async deleteEvent(societyId: string, userId: string, id: string) {
    const existing = await this.prisma.communityEvent.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException('Community event not found.');
    }

    await this.prisma.communityEvent.delete({ where: { id } });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'COMMUNITY_EVENT_CANCELLED',
      targetType: 'CommunityEvent',
      targetId: id,
      outcome: 'SUCCESS',
      safeMetadata: { title: existing.title },
    });

    return { success: true };
  }

  // ==================== EMERGENCY CONTACTS ====================

  async getEmergencyContacts(societyId: string, activeOnly = true) {
    return this.prisma.emergencyContact.findMany({
      where: {
        societyId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createEmergencyContact(
    societyId: string,
    dto: CreateEmergencyContactDto,
  ) {
    return this.prisma.emergencyContact.create({
      data: {
        societyId,
        name: dto.name,
        category: dto.category,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone || null,
        description: dto.description || null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateEmergencyContact(
    societyId: string,
    id: string,
    dto: UpdateEmergencyContactDto,
  ) {
    const existing = await this.prisma.emergencyContact.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException('Emergency contact not found.');
    }

    return this.prisma.emergencyContact.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.alternatePhone !== undefined
          ? { alternatePhone: dto.alternatePhone }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.displayOrder !== undefined
          ? { displayOrder: dto.displayOrder }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteEmergencyContact(societyId: string, id: string) {
    const existing = await this.prisma.emergencyContact.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException('Emergency contact not found.');
    }

    await this.prisma.emergencyContact.delete({ where: { id } });
    return { success: true };
  }
}
