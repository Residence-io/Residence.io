/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-base-to-string */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RequestUser } from '../common/request-context';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';
import { WorkforceService } from '../workforce/workforce.service';
import {
  AdminAssignmentDto,
  AppointmentDto,
  ComplaintSubmissionDto,
  MaintenanceSubmissionDto,
  PriorityDto,
  RatingDto,
  ResolutionDto,
  ServiceLevelDto,
  TicketCategoryDto,
  TicketMessageDto,
  TicketQueryDto,
  TicketTransitionDto,
  WorkerAssignmentDto,
} from './dto/ticket.dto';
import { TicketIdService } from './ticket-id.service';
import {
  canTransition,
  safeDisclosure,
  slaTargets,
  withinReopenWindow,
} from './ticket-workflow';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ids: TicketIdService,
    private readonly storage: PrivateStorageService,
    private readonly workforce: WorkforceService,
  ) {}

  categories(actor: RequestUser, type: 'complaint' | 'maintenance') {
    return type === 'complaint'
      ? this.prisma.complaintCategory.findMany({
          where: { societyId: actor.societyId },
          orderBy: { name: 'asc' },
        })
      : this.prisma.maintenanceCategory.findMany({
          where: { societyId: actor.societyId },
          orderBy: { name: 'asc' },
        });
  }
  async createCategory(
    actor: RequestUser,
    type: 'complaint' | 'maintenance',
    dto: TicketCategoryDto,
  ) {
    this.requireManage(actor, type);
    const common = {
      societyId: actor.societyId,
      name: dto.name.trim(),
      normalizedName: dto.name.trim().toUpperCase(),
      description: dto.description?.trim(),
    };
    const item =
      type === 'complaint'
        ? await this.prisma.complaintCategory.create({ data: common })
        : await this.prisma.maintenanceCategory.create({
            data: {
              ...common,
              workerCategoryId: dto.workerCategoryId,
              requiredSkillId: dto.requiredSkillId,
            },
          });
    await this.audit(
      actor,
      `${type.toUpperCase()}_CATEGORY_CREATED`,
      `${type}Category`,
      item.id,
    );
    return item;
  }

  async submitComplaint(actor: RequestUser, dto: ComplaintSubmissionDto) {
    const resident = await this.currentResident(actor);
    return this.prisma.$transaction(
      async (tx) => {
        const category = await tx.complaintCategory.findFirst({
          where: {
            id: dto.categoryId,
            societyId: actor.societyId,
            active: true,
          },
        });
        if (!category)
          throw new BadRequestException('Active complaint category not found.');
        const duplicate = await tx.complaint.count({
          where: {
            residentId: resident.id,
            subject: { equals: dto.subject.trim(), mode: 'insensitive' },
            createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
            status: { notIn: ['CLOSED', 'REJECTED'] },
          },
        });
        if (duplicate)
          throw new ConflictException(
            'A similar recent complaint already exists.',
          );
        const occupancy = await this.occupancy(tx, resident.id);
        const createdAt = new Date();
        const targets = await this.targets(
          tx,
          actor.societyId,
          'COMPLAINT',
          category.id,
          dto.urgency,
          createdAt,
        );
        const ticketNumber = await this.ids.next(
          tx,
          actor.societyId,
          'COMPLAINT',
        );
        const ticket = await tx.complaint.create({
          data: {
            societyId: actor.societyId,
            residentId: resident.id,
            categoryId: category.id,
            propertyId: occupancy?.unit.propertyId,
            unitId: occupancy?.unitId,
            ticketNumber,
            subject: dto.subject.trim(),
            description: dto.description.trim(),
            location: dto.location?.trim(),
            residentUrgency: dto.urgency as any,
            priority: dto.urgency as any,
            privacy: dto.privacy as any,
            preferredContactMethod: dto.preferredContactMethod,
            propertySnapshot: this.snapshot(occupancy),
            ...targets,
            statusHistory: {
              create: {
                toStatus: 'SUBMITTED',
                residentExplanation: 'Complaint submitted.',
                actedByUserId: actor.id,
              },
            },
          },
        });
        await this.txAudit(
          tx,
          actor,
          'COMPLAINT_SUBMITTED',
          'Complaint',
          ticket.id,
          { ticketNumber, privacy: ticket.privacy },
        );
        await this.outbox(tx, 'Complaint', ticket.id, 'COMPLAINT_SUBMITTED', {
          ticketNumber,
          residentId: resident.id,
        });
        return {
          id: ticket.id,
          ticketNumber,
          status: ticket.status,
          createdAt: ticket.createdAt,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async submitMaintenance(actor: RequestUser, dto: MaintenanceSubmissionDto) {
    const resident = await this.currentResident(actor);
    if ((dto.preferredStartMinute ?? 0) >= (dto.preferredEndMinute ?? 1440))
      throw new BadRequestException('Preferred visit time range is invalid.');
    return this.prisma.$transaction(
      async (tx) => {
        const category = await tx.maintenanceCategory.findFirst({
          where: {
            id: dto.categoryId,
            societyId: actor.societyId,
            active: true,
          },
        });
        if (!category)
          throw new BadRequestException(
            'Active maintenance category not found.',
          );
        const occupancy = await this.occupancy(tx, resident.id);
        const createdAt = new Date();
        const targets = await this.targets(
          tx,
          actor.societyId,
          'MAINTENANCE',
          category.id,
          dto.urgency,
          createdAt,
        );
        const ticketNumber = await this.ids.next(
          tx,
          actor.societyId,
          'MAINTENANCE',
        );
        const ticket = await tx.maintenanceRequest.create({
          data: {
            societyId: actor.societyId,
            residentId: resident.id,
            categoryId: category.id,
            propertyId: occupancy?.unit.propertyId,
            unitId: occupancy?.unitId,
            ticketNumber,
            subject: dto.subject.trim(),
            description: dto.description.trim(),
            exactLocation: dto.exactLocation.trim(),
            preferredVisitDate: dto.preferredVisitDate
              ? new Date(dto.preferredVisitDate)
              : undefined,
            preferredStartMinute: dto.preferredStartMinute,
            preferredEndMinute: dto.preferredEndMinute,
            accessInstructions: dto.accessInstructions?.trim(),
            residentUrgency: dto.urgency as any,
            priority: dto.urgency as any,
            preferredContactMethod: dto.preferredContactMethod,
            contactDisclosureConsent: dto.contactDisclosureConsent,
            propertySnapshot: this.snapshot(occupancy),
            ...targets,
            statusHistory: {
              create: {
                toStatus: 'SUBMITTED',
                residentExplanation: 'Maintenance request submitted.',
                actedByUserId: actor.id,
              },
            },
          },
        });
        await this.txAudit(
          tx,
          actor,
          'MAINTENANCE_SUBMITTED',
          'MaintenanceRequest',
          ticket.id,
          { ticketNumber },
        );
        await this.outbox(
          tx,
          'MaintenanceRequest',
          ticket.id,
          'MAINTENANCE_SUBMITTED',
          { ticketNumber, residentId: resident.id },
        );
        return {
          id: ticket.id,
          ticketNumber,
          status: ticket.status,
          createdAt: ticket.createdAt,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async list(
    actor: RequestUser,
    type: 'complaint' | 'maintenance',
    query: TicketQueryDto,
  ) {
    const resident = await this.residentOrNull(actor);
    const admin = this.canManage(actor, type);
    if (!admin && !resident)
      throw new ForbiddenException('Ticket access is not permitted.');
    const where: any = {
      societyId: actor.societyId,
      ...(admin ? {} : { residentId: resident!.id }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(type === 'complaint' && query.privacy
        ? { privacy: query.privacy }
        : {}),
      ...(query.overdue
        ? {
            targetResolutionAt: { lt: new Date() },
            status: {
              notIn:
                type === 'complaint'
                  ? ['RESOLVED', 'REJECTED', 'CLOSED']
                  : ['COMPLETED', 'CANCELLED', 'REJECTED', 'CLOSED'],
            },
          }
        : {}),
      ...(query.escalated ? { escalations: { some: {} } } : {}),
      ...(query.search
        ? {
            OR: [
              { ticketNumber: { contains: query.search, mode: 'insensitive' } },
              { subject: { contains: query.search, mode: 'insensitive' } },
              {
                resident: {
                  fullName: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                resident: {
                  residentNumber: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };
    if (
      type === 'complaint' &&
      admin &&
      !actor.permissions.includes('COMPLAINT_SENSITIVE_READ')
    )
      where.privacy = { not: 'CONFIDENTIAL' };
    const delegate =
      type === 'complaint'
        ? this.prisma.complaint
        : this.prisma.maintenanceRequest;
    const [items, total] = await this.prisma.$transaction([
      (delegate as any).findMany({
        where,
        include: {
          category: true,
          resident: {
            select: { id: true, residentNumber: true, fullName: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      (delegate as any).count({ where }),
    ]);
    return {
      items: items.map((item: any) => this.safeSummary(item, admin)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async detail(
    actor: RequestUser,
    type: 'complaint' | 'maintenance',
    id: string,
  ) {
    const resident = await this.residentOrNull(actor);
    const admin = this.canManage(actor, type);
    const delegate =
      type === 'complaint'
        ? this.prisma.complaint
        : this.prisma.maintenanceRequest;
    const include =
      type === 'complaint'
        ? {
            category: true,
            resident: {
              select: { id: true, residentNumber: true, fullName: true },
            },
            messages: { orderBy: { createdAt: 'asc' } },
            attachments: { where: { status: 'ACTIVE' } },
            statusHistory: { orderBy: { createdAt: 'asc' } },
            administratorAssignments: { orderBy: { assignedAt: 'asc' } },
            escalations: true,
          }
        : {
            category: true,
            resident: {
              select: {
                id: true,
                residentNumber: true,
                fullName: true,
                primaryPhone: true,
              },
            },
            messages: { orderBy: { createdAt: 'asc' } },
            attachments: { where: { status: 'ACTIVE' } },
            statusHistory: { orderBy: { createdAt: 'asc' } },
            assignments: {
              include: {
                worker: {
                  include: {
                    primaryCategory: true,
                    skills: { include: { skill: true } },
                  },
                },
              },
              orderBy: { assignedAt: 'asc' },
            },
            appointments: { orderBy: { startsAt: 'asc' } },
            resolution: true,
            rating: true,
            escalations: true,
          };
    const item = await (delegate as any).findFirst({
      where: {
        id,
        societyId: actor.societyId,
        ...(admin
          ? {}
          : {
              residentId:
                resident?.id ?? '00000000-0000-0000-0000-000000000000',
            }),
      },
      include,
    });
    if (!item) throw new NotFoundException('Ticket not found.');
    if (
      type === 'complaint' &&
      item.privacy === 'CONFIDENTIAL' &&
      admin &&
      !actor.permissions.includes('COMPLAINT_SENSITIVE_READ')
    )
      throw new ForbiddenException(
        'Confidential complaint access is not permitted.',
      );
    if (type === 'complaint' && item.privacy === 'CONFIDENTIAL' && admin)
      await this.audit(actor, 'CONFIDENTIAL_COMPLAINT_VIEWED', 'Complaint', id);
    return this.safeDetail(item, admin);
  }

  async transition(
    actor: RequestUser,
    type: 'complaint' | 'maintenance',
    id: string,
    status: string,
    dto: TicketTransitionDto,
  ) {
    const admin = this.canManage(actor, type);
    const resident = await this.residentOrNull(actor);
    const delegate =
      type === 'complaint'
        ? this.prisma.complaint
        : this.prisma.maintenanceRequest;
    const current = await (delegate as any).findFirst({
      where: {
        id,
        societyId: actor.societyId,
        ...(admin ? {} : { residentId: resident?.id }),
      },
      include:
        type === 'maintenance'
          ? { assignments: { where: { status: 'ACTIVE' } }, resolution: true }
          : undefined,
    });
    if (!current) throw new NotFoundException('Ticket not found.');
    if (!admin && !['REOPENED', 'CLOSED'].includes(status))
      throw new ForbiddenException(
        'Residents may only confirm closure or request reopening.',
      );
    if (!canTransition(type, current.status, status))
      throw new BadRequestException(
        `Cannot transition ${current.status} to ${status}.`,
      );
    if (
      type === 'maintenance' &&
      ['WORK_IN_PROGRESS', 'VISIT_SCHEDULED'].includes(status) &&
      !current.assignments.length
    )
      throw new BadRequestException('An active worker assignment is required.');
    if (type === 'maintenance' && status === 'COMPLETED' && !current.resolution)
      throw new BadRequestException(
        'A resolution is required before completion.',
      );
    if (
      status === 'REOPENED' &&
      current.completedAt &&
      !dto.overrideReopenWindow &&
      !withinReopenWindow(current.completedAt, new Date())
    )
      throw new BadRequestException('The reopening window has expired.');
    return this.prisma.$transaction(async (tx) => {
      const changed = await (tx as any)[
        type === 'complaint' ? 'complaint' : 'maintenanceRequest'
      ].updateMany({
        where: { id, version: dto.version },
        data: {
          status,
          version: { increment: 1 },
          ...(status === 'CLOSED' ? { closedAt: new Date() } : {}),
          ...(type === 'complaint' && status === 'RESOLVED'
            ? { resolvedAt: new Date() }
            : {}),
          ...(type === 'maintenance' && status === 'COMPLETED'
            ? { completedAt: new Date() }
            : {}),
        },
      });
      if (!changed.count)
        throw new ConflictException('Ticket changed; refresh and try again.');
      await (tx as any)[
        type === 'complaint'
          ? 'complaintStatusHistory'
          : 'maintenanceStatusHistory'
      ].create({
        data: {
          [type === 'complaint' ? 'complaintId' : 'maintenanceRequestId']: id,
          fromStatus: current.status,
          toStatus: status,
          residentExplanation: dto.residentExplanation,
          internalReason: dto.reason,
          actedByUserId: actor.id,
        },
      });
      if (!admin && type === 'maintenance' && status === 'CLOSED')
        await tx.maintenanceResolution.updateMany({
          where: { maintenanceRequestId: id },
          data: { residentConfirmedAt: new Date(), version: { increment: 1 } },
        });
      await this.txAudit(
        tx,
        actor,
        `${type.toUpperCase()}_STATUS_CHANGED`,
        type,
        id,
        { from: current.status, to: status },
        dto.reason,
      );
      await this.outbox(tx, type, id, `${type.toUpperCase()}_STATUS_CHANGED`, {
        status,
        version: dto.version + 1,
      });
      return { id, status, version: dto.version + 1 };
    });
  }

  async setPriority(
    actor: RequestUser,
    type: 'complaint' | 'maintenance',
    id: string,
    dto: PriorityDto,
  ) {
    this.requireManage(actor, type);
    const delegate =
      type === 'complaint'
        ? this.prisma.complaint
        : this.prisma.maintenanceRequest;
    const result = await (delegate as any).updateMany({
      where: { id, societyId: actor.societyId, version: dto.version },
      data: { priority: dto.priority, version: { increment: 1 } },
    });
    if (!result.count)
      throw new ConflictException('Ticket changed or was not found.');
    await this.audit(actor, 'TICKET_PRIORITY_CHANGED', type, id, {
      priority: dto.priority,
    });
    return { id, priority: dto.priority };
  }
  async assignAdministrator(
    actor: RequestUser,
    id: string,
    dto: AdminAssignmentDto,
  ) {
    this.requireManage(actor, 'complaint');
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.complaint.findFirst({
        where: { id, societyId: actor.societyId },
      });
      if (!ticket) throw new NotFoundException('Complaint not found.');
      await tx.complaintAdministratorAssignment.updateMany({
        where: { complaintId: id, endedAt: null },
        data: { endedAt: new Date() },
      });
      const assignment = await tx.complaintAdministratorAssignment.create({
        data: {
          complaintId: id,
          administratorUserId: dto.administratorUserId,
          assignedByUserId: actor.id,
          reason: dto.reason,
        },
      });
      await this.txAudit(
        tx,
        actor,
        'COMPLAINT_ADMIN_ASSIGNED',
        'Complaint',
        id,
        { administratorUserId: dto.administratorUserId },
      );
      return assignment;
    });
  }

  async addMessage(
    actor: RequestUser,
    type: 'complaint' | 'maintenance',
    id: string,
    dto: TicketMessageDto,
  ) {
    const resident = await this.residentOrNull(actor);
    const admin = this.canManage(actor, type);
    if (!admin && dto.visibility !== 'RESIDENT_VISIBLE')
      throw new ForbiddenException('Internal messages are not permitted.');
    const delegate =
      type === 'complaint'
        ? this.prisma.complaint
        : this.prisma.maintenanceRequest;
    const ticket = await (delegate as any).findFirst({
      where: {
        id,
        societyId: actor.societyId,
        ...(admin ? {} : { residentId: resident?.id }),
        status: { notIn: ['CLOSED', 'REJECTED', 'CANCELLED'] },
      },
    });
    if (!ticket) throw new NotFoundException('Open ticket not found.');
    const message = await (this.prisma as any)[
      type === 'complaint' ? 'complaintMessage' : 'maintenanceMessage'
    ].create({
      data: {
        [type === 'complaint' ? 'complaintId' : 'maintenanceRequestId']: id,
        authorUserId: actor.id,
        body: dto.body.trim(),
        visibility: dto.visibility,
      },
    });
    await this.audit(
      actor,
      dto.visibility === 'INTERNAL'
        ? 'TICKET_INTERNAL_NOTE_ADDED'
        : 'TICKET_MESSAGE_ADDED',
      type,
      id,
      { visibility: dto.visibility },
    );
    return message;
  }

  async eligible(
    actor: RequestUser,
    id: string,
    startsAt: string,
    endsAt: string,
  ) {
    this.requireManage(actor, 'maintenance');
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: { id, societyId: actor.societyId },
      include: { category: true },
    });
    if (!request) throw new NotFoundException('Maintenance request not found.');
    return this.workforce.findEligible(actor, {
      categoryId: request.category.workerCategoryId ?? undefined,
      skillId: request.category.requiredSkillId ?? undefined,
      startsAt,
      endsAt,
      serviceArea: (request.propertySnapshot as any)?.block,
    });
  }

  async assignWorker(actor: RequestUser, id: string, dto: WorkerAssignmentDto) {
    this.requireManage(actor, 'maintenance');
    const eligible = await this.eligible(actor, id, dto.startsAt, dto.endsAt);
    if (!eligible.some((worker: any) => worker.id === dto.workerId))
      throw new BadRequestException(
        'Worker is not eligible or available for this request.',
      );
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findFirst({
        where: { id, societyId: actor.societyId },
      });
      if (!request)
        throw new NotFoundException('Maintenance request not found.');
      await tx.workerAssignment.updateMany({
        where: { maintenanceRequestId: id, status: 'ACTIVE' },
        data: {
          status: 'CANCELLED',
          endedAt: new Date(),
          version: { increment: 1 },
        },
      });
      const assignment = await tx.workerAssignment.create({
        data: {
          maintenanceRequestId: id,
          workerId: dto.workerId,
          reason: dto.reason,
          assignedByUserId: actor.id,
        },
      });
      await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: 'ASSIGNED',
          version: { increment: 1 },
          statusHistory: {
            create: {
              fromStatus: request.status,
              toStatus: 'ASSIGNED',
              residentExplanation: 'A service worker has been assigned.',
              internalReason: dto.reason,
              actedByUserId: actor.id,
            },
          },
        },
      });
      await this.txAudit(
        tx,
        actor,
        'WORKER_ASSIGNED',
        'MaintenanceRequest',
        id,
        { workerId: dto.workerId },
      );
      await this.outbox(tx, 'MaintenanceRequest', id, 'WORKER_ASSIGNED', {
        workerId: dto.workerId,
      });
      return assignment;
    });
  }

  async schedule(actor: RequestUser, id: string, dto: AppointmentDto) {
    this.requireManage(actor, 'maintenance');
    const startsAt = new Date(dto.startsAt),
      endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt)
      throw new BadRequestException('Appointment end must follow start.');
    return this.prisma.$transaction(
      async (tx) => {
        const request = await tx.maintenanceRequest.findFirst({
          where: { id, societyId: actor.societyId },
          include: { assignments: { where: { status: 'ACTIVE' }, take: 1 } },
        });
        const assignment = request?.assignments[0];
        if (!request || !assignment)
          throw new BadRequestException(
            'Active worker assignment is required.',
          );
        const reservation = await tx.workerScheduleReservation.create({
          data: {
            workerId: assignment.workerId,
            startsAt,
            endsAt,
            serviceArea: (request.propertySnapshot as any)?.block,
            purpose: `Maintenance ${request.ticketNumber}`,
            createdByUserId: actor.id,
          },
        });
        const appointment = await tx.maintenanceAppointment.create({
          data: {
            maintenanceRequestId: id,
            workerAssignmentId: assignment.id,
            workerId: assignment.workerId,
            reservationId: reservation.id,
            startsAt,
            endsAt,
            status: 'CONFIRMED',
            accessInstructions: dto.accessInstructions,
            changeReason: dto.reason,
            createdByUserId: actor.id,
          },
        });
        await tx.maintenanceRequest.update({
          where: { id },
          data: {
            status: 'VISIT_SCHEDULED',
            version: { increment: 1 },
            statusHistory: {
              create: {
                fromStatus: request.status,
                toStatus: 'VISIT_SCHEDULED',
                residentExplanation: 'A maintenance visit has been scheduled.',
                internalReason: dto.reason,
                actedByUserId: actor.id,
              },
            },
          },
        });
        await this.discloseTx(tx, actor, request, assignment.workerId);
        await this.txAudit(
          tx,
          actor,
          'MAINTENANCE_APPOINTMENT_SCHEDULED',
          'MaintenanceRequest',
          id,
          { appointmentId: appointment.id },
        );
        await this.outbox(
          tx,
          'MaintenanceRequest',
          id,
          'APPOINTMENT_SCHEDULED',
          { appointmentId: appointment.id, startsAt },
        );
        return appointment;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reschedule(
    actor: RequestUser,
    id: string,
    appointmentId: string,
    dto: AppointmentDto,
  ) {
    this.requireManage(actor, 'maintenance');
    if (!dto.reason)
      throw new BadRequestException('Rescheduling reason is required.');
    return this.prisma.$transaction(
      async (tx) => {
        const previous = await tx.maintenanceAppointment.findFirst({
          where: {
            id: appointmentId,
            maintenanceRequestId: id,
            request: { societyId: actor.societyId },
            status: { in: ['PROPOSED', 'CONFIRMED'] },
          },
        });
        if (!previous)
          throw new NotFoundException('Active appointment not found.');
        if (previous.reservationId)
          await tx.workerScheduleReservation.update({
            where: { id: previous.reservationId },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: dto.reason,
              version: { increment: 1 },
            },
          });
        await tx.maintenanceAppointment.update({
          where: { id: previous.id },
          data: {
            status: 'RESCHEDULED',
            changeReason: dto.reason,
            version: { increment: 1 },
          },
        });
        const startsAt = new Date(dto.startsAt),
          endsAt = new Date(dto.endsAt);
        if (endsAt <= startsAt)
          throw new BadRequestException('Appointment end must follow start.');
        const reservation = await tx.workerScheduleReservation.create({
          data: {
            workerId: previous.workerId,
            startsAt,
            endsAt,
            purpose: 'Rescheduled maintenance appointment',
            createdByUserId: actor.id,
          },
        });
        const next = await tx.maintenanceAppointment.create({
          data: {
            maintenanceRequestId: id,
            workerAssignmentId: previous.workerAssignmentId,
            workerId: previous.workerId,
            reservationId: reservation.id,
            startsAt,
            endsAt,
            status: 'CONFIRMED',
            accessInstructions: dto.accessInstructions,
            changeReason: dto.reason,
            createdByUserId: actor.id,
          },
        });
        await this.txAudit(
          tx,
          actor,
          'MAINTENANCE_APPOINTMENT_RESCHEDULED',
          'MaintenanceRequest',
          id,
          { previousAppointmentId: previous.id, appointmentId: next.id },
        );
        await this.outbox(
          tx,
          'MaintenanceRequest',
          id,
          'APPOINTMENT_RESCHEDULED',
          { appointmentId: next.id, startsAt },
        );
        return next;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async resolve(actor: RequestUser, id: string, dto: ResolutionDto) {
    this.requireManage(actor, 'maintenance');
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findFirst({
        where: { id, societyId: actor.societyId },
        include: { assignments: { where: { status: 'ACTIVE' }, take: 1 } },
      });
      const assignment = request?.assignments[0];
      if (!request || !assignment)
        throw new BadRequestException('Active worker assignment is required.');
      const resolution = await tx.maintenanceResolution.upsert({
        where: { maintenanceRequestId: id },
        update: {
          workPerformed: dto.workPerformed,
          residentSummary: dto.residentSummary,
          partsNotes: dto.partsNotes,
          internalNotes: dto.internalNotes,
          followUpRecommendation: dto.followUpRecommendation,
          completedAt: new Date(),
          verifiedByUserId: actor.id,
          version: { increment: 1 },
        },
        create: {
          maintenanceRequestId: id,
          workerId: assignment.workerId,
          workPerformed: dto.workPerformed,
          residentSummary: dto.residentSummary,
          partsNotes: dto.partsNotes,
          internalNotes: dto.internalNotes,
          followUpRecommendation: dto.followUpRecommendation,
          completedAt: new Date(),
          verifiedByUserId: actor.id,
        },
      });
      await this.txAudit(
        tx,
        actor,
        'MAINTENANCE_RESOLUTION_RECORDED',
        'MaintenanceRequest',
        id,
        { workerId: assignment.workerId },
      );
      await this.outbox(tx, 'MaintenanceRequest', id, 'MAINTENANCE_RESOLVED', {
        ticketNumber: request.ticketNumber,
      });
      return resolution;
    });
  }

  async rate(actor: RequestUser, id: string, dto: RatingDto) {
    const resident = await this.currentResident(actor);
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: {
        id,
        residentId: resident.id,
        societyId: actor.societyId,
        status: { in: ['COMPLETED', 'CLOSED'] },
      },
      include: { assignments: { orderBy: { assignedAt: 'desc' }, take: 1 } },
    });
    const workerId = request?.assignments[0]?.workerId;
    if (!request || !workerId)
      throw new BadRequestException(
        'Only completed assigned maintenance can be rated.',
      );
    return this.prisma.$transaction(async (tx) => {
      const rating = await tx.serviceRating.create({
        data: {
          maintenanceRequestId: id,
          residentId: resident.id,
          workerId,
          overall: dto.overall,
          serviceQuality: dto.serviceQuality,
          timeliness: dto.timeliness,
          professionalBehaviour: dto.professionalBehaviour,
          comments: dto.comments,
          confidentialComments: dto.confidentialComments,
        },
      });
      await tx.workerPerformanceNote.create({
        data: {
          workerId,
          reliability: dto.timeliness,
          workQuality: dto.serviceQuality,
          note: `Verified service rating for ${request.ticketNumber}`,
          reviewDate: new Date(),
          reviewedByUserId: actor.id,
        },
      });
      await this.txAudit(
        tx,
        actor,
        'SERVICE_RATING_SUBMITTED',
        'MaintenanceRequest',
        id,
        { overall: dto.overall },
      );
      return { id: rating.id, overall: rating.overall };
    });
  }

  async createServiceLevel(actor: RequestUser, dto: ServiceLevelDto) {
    this.requireManage(
      actor,
      dto.ticketType === 'COMPLAINT' ? 'complaint' : 'maintenance',
    );
    const policy = await this.prisma.serviceLevelPolicy.create({
      data: {
        societyId: actor.societyId,
        ticketType: dto.ticketType as any,
        categoryId: dto.categoryId,
        priority: dto.priority as any,
        responseMinutes: dto.responseMinutes,
        resolutionMinutes: dto.resolutionMinutes,
        escalationRoleCode: dto.escalationRoleCode,
      },
    });
    await this.audit(
      actor,
      'SLA_POLICY_CREATED',
      'ServiceLevelPolicy',
      policy.id,
    );
    return policy;
  }
  serviceLevels(actor: RequestUser) {
    if (
      !this.canManage(actor, 'complaint') &&
      !this.canManage(actor, 'maintenance')
    )
      throw new ForbiddenException();
    return this.prisma.serviceLevelPolicy.findMany({
      where: { societyId: actor.societyId },
      orderBy: [{ ticketType: 'asc' }, { priority: 'desc' }],
    });
  }
  async escalateDue(actor: RequestUser) {
    if (
      !actor.roles.includes('SUPER_ADMINISTRATOR') &&
      !actor.roles.includes('ADMINISTRATOR')
    )
      throw new ForbiddenException();
    const now = new Date();
    let created = 0;
    for (const [type, delegate] of [
      ['Complaint', this.prisma.complaint],
      ['MaintenanceRequest', this.prisma.maintenanceRequest],
    ] as const) {
      const tickets = await (delegate as any).findMany({
        where: {
          societyId: actor.societyId,
          targetResolutionAt: { lt: now },
          status: {
            notIn:
              type === 'Complaint'
                ? ['RESOLVED', 'REJECTED', 'CLOSED']
                : ['COMPLETED', 'CANCELLED', 'REJECTED', 'CLOSED'],
          },
        },
        take: 500,
      });
      for (const ticket of tickets) {
        const key = `phase5:resolution-overdue:${type}:${ticket.id}`;
        const result = await this.prisma.escalationRecord.createMany({
          data: [
            {
              [type === 'Complaint' ? 'complaintId' : 'maintenanceRequestId']:
                ticket.id,
              kind: 'RESOLUTION_OVERDUE',
              escalationRoleCode: 'ADMINISTRATOR',
              idempotencyKey: key,
            },
          ],
          skipDuplicates: true,
        });
        if (result.count) {
          created++;
          await this.prisma.outboxEvent.create({
            data: {
              aggregateType: type,
              aggregateId: ticket.id,
              eventType: 'TICKET_ESCALATED',
              payload: { kind: 'RESOLUTION_OVERDUE' },
              deduplicationKey: key,
            },
          });
        }
      }
    }
    return { created };
  }

  async upload(
    actor: RequestUser,
    type: 'complaint' | 'maintenance',
    id: string,
    sensitive: boolean,
    file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Attachment is required.');
    await this.detail(actor, type, id);
    const stored = await this.storage.store(
      id,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    try {
      const item = await (this.prisma as any)[
        type === 'complaint' ? 'complaintAttachment' : 'maintenanceAttachment'
      ].create({
        data: {
          [type === 'complaint' ? 'complaintId' : 'maintenanceRequestId']: id,
          ...stored,
          sizeBytes: BigInt(stored.sizeBytes),
          sensitive,
          uploadedByUserId: actor.id,
        },
      });
      await this.audit(actor, 'TICKET_ATTACHMENT_UPLOADED', type, id, {
        attachmentId: item.id,
        sensitive,
      });
      return {
        id: item.id,
        mediaType: item.mediaType,
        sizeBytes: stored.sizeBytes,
      };
    } catch (error) {
      await this.storage.remove(stored.objectKey);
      throw error;
    }
  }
  async download(
    actor: RequestUser,
    type: 'complaint' | 'maintenance',
    id: string,
    attachmentId: string,
  ) {
    const detail = await this.detail(actor, type, id);
    const admin = this.canManage(actor, type);
    const item = await (this.prisma as any)[
      type === 'complaint' ? 'complaintAttachment' : 'maintenanceAttachment'
    ].findFirst({
      where: {
        id: attachmentId,
        [type === 'complaint' ? 'complaintId' : 'maintenanceRequestId']: id,
        status: 'ACTIVE',
      },
    });
    if (!item || (item.sensitive && !admin))
      throw new NotFoundException('Attachment not found.');
    const buffer = await this.storage.read(item.objectKey);
    await this.audit(actor, 'TICKET_ATTACHMENT_ACCESSED', type, id, {
      attachmentId,
    });
    return {
      buffer,
      fileName: item.originalFileName,
      mediaType: item.mediaType,
      ticket: detail.ticketNumber,
    };
  }

  async dashboard(actor: RequestUser) {
    const admin =
      this.canManage(actor, 'complaint') ||
      this.canManage(actor, 'maintenance');
    const resident = admin ? null : await this.currentResident(actor);
    const now = new Date(),
      start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const base = admin
      ? { societyId: actor.societyId }
      : { residentId: resident!.id };
    const [
      openComplaints,
      activeMaintenance,
      unassigned,
      urgent,
      overdue,
      todayAppointments,
    ] = await Promise.all([
      this.prisma.complaint.count({
        where: {
          ...base,
          status: { notIn: ['RESOLVED', 'REJECTED', 'CLOSED'] },
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          ...base,
          status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED', 'CLOSED'] },
        },
      }),
      admin
        ? this.prisma.maintenanceRequest.count({
            where: {
              ...base,
              status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
              assignments: { none: { status: 'ACTIVE' } },
            },
          })
        : 0,
      this.prisma.maintenanceRequest.count({
        where: {
          ...base,
          priority: { in: ['URGENT', 'EMERGENCY'] },
          status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          ...base,
          targetResolutionAt: { lt: now },
          status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] },
        },
      }),
      this.prisma.maintenanceAppointment.count({
        where: {
          request: base,
          startsAt: { gte: start, lt: end },
          status: { in: ['CONFIRMED', 'RESCHEDULED'] },
        },
      }),
    ]);
    return {
      openComplaints,
      activeMaintenance,
      unassigned,
      urgent,
      overdue,
      todayAppointments,
    };
  }
  async exportCsv(actor: RequestUser, type: 'complaints' | 'maintenance') {
    if (!actor.permissions.includes('TICKET_EXPORT'))
      throw new ForbiddenException('Ticket export is not permitted.');
    const result = await this.list(
      actor,
      type === 'complaints' ? 'complaint' : 'maintenance',
      { page: 1, pageSize: 100, search: undefined },
    );
    const rows = [
      ['Ticket', 'Subject', 'Category', 'Status', 'Priority', 'Created'],
      ...result.items.map((item: any) => [
        item.ticketNumber,
        item.subject,
        item.category.name,
        item.status,
        item.priority,
        item.createdAt,
      ]),
    ];
    await this.audit(actor, 'TICKET_EXPORT_GENERATED', type, 'csv', {
      count: result.items.length,
    });
    return rows
      .map((row) => row.map((value: unknown) => this.csv(value)).join(','))
      .join('\r\n');
  }

  private async currentResident(actor: RequestUser) {
    const resident = await this.prisma.resident.findFirst({
      where: { userId: actor.id, societyId: actor.societyId, status: 'ACTIVE' },
    });
    if (!resident)
      throw new ForbiddenException('An active resident profile is required.');
    return resident;
  }
  private residentOrNull(actor: RequestUser) {
    return this.prisma.resident.findFirst({
      where: { userId: actor.id, societyId: actor.societyId },
    });
  }
  private occupancy(tx: Prisma.TransactionClient, residentId: string) {
    return tx.residentOccupancy.findFirst({
      where: { residentId, endDate: null },
      include: { unit: { include: { property: true } } },
      orderBy: { startDate: 'desc' },
    });
  }
  private snapshot(occupancy: any): Prisma.InputJsonValue {
    return occupancy
      ? {
          block: occupancy.unit.property.block,
          propertyNumber: occupancy.unit.property.propertyNumber,
          unitNumber: occupancy.unit.unitNumber,
        }
      : {};
  }
  private async targets(
    tx: Prisma.TransactionClient,
    societyId: string,
    type: string,
    categoryId: string,
    priority: string,
    createdAt: Date,
  ) {
    const policy = await tx.serviceLevelPolicy.findFirst({
      where: {
        societyId,
        ticketType: type as any,
        priority: priority as any,
        active: true,
        OR: [{ categoryId }, { categoryId: null }],
      },
      orderBy: { categoryId: 'desc' },
    });
    return policy
      ? slaTargets(createdAt, policy.responseMinutes, policy.resolutionMinutes)
      : {};
  }
  private canManage(actor: RequestUser, type: 'complaint' | 'maintenance') {
    return actor.permissions.includes(
      type === 'complaint' ? 'COMPLAINT_MANAGE' : 'MAINTENANCE_MANAGE',
    );
  }
  private requireManage(actor: RequestUser, type: 'complaint' | 'maintenance') {
    if (!this.canManage(actor, type))
      throw new ForbiddenException(`${type} management is not permitted.`);
  }
  private safeSummary(item: any, admin: boolean) {
    const safe = { ...item };
    delete safe.description;
    delete safe.propertySnapshot;
    return { ...safe, ...(admin ? {} : { resident: undefined }) };
  }
  private safeDetail(item: any, admin: boolean) {
    const safe = {
      ...item,
      messages: item.messages?.filter(
        (message: any) => admin || message.visibility === 'RESIDENT_VISIBLE',
      ),
      statusHistory: item.statusHistory?.map((entry: any) =>
        admin
          ? entry
          : {
              id: entry.id,
              fromStatus: entry.fromStatus,
              toStatus: entry.toStatus,
              residentExplanation: entry.residentExplanation,
              createdAt: entry.createdAt,
            },
      ),
      attachments: item.attachments
        ?.filter((attachment: any) => admin || !attachment.sensitive)
        .map((attachment: any) => ({
          id: attachment.id,
          mediaType: attachment.mediaType,
          sizeBytes: attachment.sizeBytes,
          createdAt: attachment.createdAt,
          sensitive: admin ? attachment.sensitive : undefined,
        })),
    };
    if (!admin) {
      delete safe.administratorAssignments;
      delete safe.escalations;
      if (safe.resolution) delete safe.resolution.internalNotes;
      if (safe.rating) delete safe.rating.confidentialComments;
      const contactApproved =
        item.contactDisclosureConsent &&
        item.appointments?.some((appointment: any) =>
          ['CONFIRMED', 'RESCHEDULED', 'IN_PROGRESS'].includes(
            appointment.status,
          ),
        );
      if (safe.assignments)
        safe.assignments = safe.assignments.map((assignment: any) => ({
          id: assignment.id,
          status: assignment.status,
          assignedAt: assignment.assignedAt,
          worker: {
            id: assignment.worker.id,
            workerNumber: assignment.worker.workerNumber,
            fullName: assignment.worker.fullName,
            primaryCategory: assignment.worker.primaryCategory,
            ...(contactApproved
              ? { approvedPhone: assignment.worker.primaryPhone }
              : {}),
          },
        }));
    }
    return safe;
  }
  private async discloseTx(
    tx: Prisma.TransactionClient,
    actor: RequestUser,
    request: any,
    workerId: string,
  ) {
    if (!request.contactDisclosureConsent) return;
    for (const audience of ['resident', 'worker'] as const)
      await tx.contactDisclosureLog.create({
        data: {
          maintenanceRequestId: request.id,
          recipientType: audience.toUpperCase(),
          recipientId: audience === 'resident' ? request.residentId : workerId,
          disclosedFields: safeDisclosure(audience),
          policyBasis: 'Resident consent and confirmed maintenance appointment',
          actedByUserId: actor.id,
        },
      });
  }
  private audit(
    actor: RequestUser,
    action: string,
    targetType: string,
    targetId: string,
    safeMetadata: Record<string, unknown> = {},
  ) {
    return this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action,
        targetType,
        targetId,
        outcome: 'SUCCESS',
        safeMetadata: safeMetadata as Prisma.InputJsonValue,
      },
    });
  }
  private txAudit(
    tx: Prisma.TransactionClient,
    actor: RequestUser,
    action: string,
    targetType: string,
    targetId: string,
    safeMetadata: Record<string, unknown> = {},
    reason?: string,
  ) {
    return tx.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action,
        targetType,
        targetId,
        outcome: 'SUCCESS',
        reason,
        safeMetadata: safeMetadata as Prisma.InputJsonValue,
      },
    });
  }
  private outbox(
    tx: Prisma.TransactionClient,
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    const discriminator =
      payload.appointmentId ??
      payload.workerId ??
      payload.version ??
      payload.ticketNumber ??
      'initial';
    return tx.outboxEvent.create({
      data: {
        aggregateType,
        aggregateId,
        eventType,
        payload: payload as Prisma.InputJsonValue,
        deduplicationKey: `phase5:${eventType}:${aggregateId}:${String(discriminator)}`,
      },
    });
  }
  private csv(value: unknown) {
    return `"${String(value ?? '').replaceAll('"', '""')}"`;
  }
}
