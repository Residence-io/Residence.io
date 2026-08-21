import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateResidentRequestDto,
  ReviewResidentRequestDto,
  IssueResidentRequestDto,
} from './dto/self-service.dto';
import {
  ResidentRequestStatus,
  ResidentRequestType,
  Prisma,
} from '../generated/prisma/client';
import { randomBytes } from 'node:crypto';

@Injectable()
export class ResidentRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private generateRequestNumber(): string {
    const year = new Date().getFullYear();
    const rand = randomBytes(5).toString('hex').toUpperCase();
    return `REQ-${year}-${rand}`;
  }

  async getResidentRequests(societyId: string, residentId: string) {
    return this.prisma.residentRequest.findMany({
      where: { societyId, residentId },
      include: {
        property: { select: { block: true, propertyNumber: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResidentRequestById(
    societyId: string,
    residentId: string,
    id: string,
  ) {
    const request = await this.prisma.residentRequest.findFirst({
      where: { id, societyId, residentId },
      include: {
        property: { select: { block: true, propertyNumber: true } },
        unit: { select: { unitNumber: true } },
      },
    });
    if (!request) {
      throw new NotFoundException('Resident request not found.');
    }
    return request;
  }

  async createRequest(
    societyId: string,
    residentId: string,
    userId: string,
    dto: CreateResidentRequestDto,
  ) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId },
    });
    if (!resident) {
      throw new NotFoundException('Resident profile not found.');
    }

    let attempts = 0;
    const maxAttempts = 3;
    let request: any = null;

    while (attempts < maxAttempts) {
      try {
        const requestNumber = this.generateRequestNumber();
        request = await this.prisma.residentRequest.create({
          data: {
            societyId,
            residentId,
            propertyId: dto.propertyId || null,
            unitId: dto.unitId || null,
            requestNumber,
            requestType: dto.requestType,
            title: dto.title,
            description: dto.description || null,
            status: ResidentRequestStatus.SUBMITTED,
            metadata: (dto.metadata as Prisma.InputJsonValue) || Prisma.DbNull,
          },
          include: {
            resident: { select: { fullName: true, residentNumber: true } },
          },
        });
        break;
      } catch (err: any) {
        if (
          err?.code === 'P2002' &&
          (err?.meta?.target?.includes('request_number') ||
            err?.meta?.target?.includes('requestNumber'))
        ) {
          attempts++;
          if (attempts >= maxAttempts) throw err;
          continue;
        }
        throw err;
      }
    }

    if (!request) {
      throw new BadRequestException(
        'Could not generate a unique request number. Please try again.',
      );
    }

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'REQUEST_CREATED',
      targetType: 'ResidentRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        requestNumber: request.requestNumber,
        requestType: dto.requestType,
        title: dto.title,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'REQUEST_SUBMITTED',
      targetType: 'ResidentRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: { requestNumber: request.requestNumber },
    });

    return request;
  }

  async cancelRequest(
    societyId: string,
    residentId: string,
    userId: string,
    id: string,
  ) {
    const request = await this.prisma.residentRequest.findFirst({
      where: { id, societyId, residentId },
    });
    if (!request) {
      throw new NotFoundException('Resident request not found.');
    }

    if (
      request.status !== ResidentRequestStatus.SUBMITTED &&
      request.status !== ResidentRequestStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot cancel a request that is already ${request.status}.`,
      );
    }

    const updated = await this.prisma.residentRequest.update({
      where: { id },
      data: { status: ResidentRequestStatus.CANCELLED },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'REQUEST_CANCELLED',
      targetType: 'ResidentRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: { requestNumber: request.requestNumber },
    });

    return updated;
  }

  async getAdminRequests(
    societyId: string,
    filters?: {
      status?: ResidentRequestStatus;
      requestType?: ResidentRequestType;
    },
  ) {
    return this.prisma.residentRequest.findMany({
      where: {
        societyId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.requestType ? { requestType: filters.requestType } : {}),
      },
      include: {
        resident: {
          select: { id: true, fullName: true, residentNumber: true },
        },
        property: { select: { block: true, propertyNumber: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminRequestById(societyId: string, id: string) {
    const request = await this.prisma.residentRequest.findFirst({
      where: { id, societyId },
      include: {
        resident: true,
        property: true,
        unit: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Resident request not found.');
    }
    return request;
  }

  async reviewRequest(
    societyId: string,
    id: string,
    reviewerUserId: string,
    dto: ReviewResidentRequestDto,
  ) {
    const request = await this.prisma.residentRequest.findFirst({
      where: { id, societyId },
      include: { resident: true },
    });
    if (!request) {
      throw new NotFoundException('Resident request not found.');
    }

    if (request.status === ResidentRequestStatus.CANCELLED) {
      throw new BadRequestException('Cannot review a cancelled request.');
    }

    const newStatus =
      dto.status === 'APPROVED'
        ? ResidentRequestStatus.APPROVED
        : dto.status === 'REJECTED'
          ? ResidentRequestStatus.REJECTED
          : ResidentRequestStatus.UNDER_REVIEW;

    const updated = await this.prisma.residentRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedByUserId: reviewerUserId,
        rejectionReason:
          newStatus === ResidentRequestStatus.REJECTED
            ? dto.rejectionReason
            : null,
      },
    });

    const auditAction =
      newStatus === ResidentRequestStatus.APPROVED
        ? 'REQUEST_APPROVED'
        : newStatus === ResidentRequestStatus.REJECTED
          ? 'REQUEST_REJECTED'
          : 'REQUEST_REVIEW_STARTED';

    await this.audit.recordSafely({
      societyId,
      actorUserId: reviewerUserId,
      action: auditAction,
      targetType: 'ResidentRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: { requestNumber: request.requestNumber, status: newStatus },
    });

    if (request.resident.userId) {
      try {
        await this.prisma.notification.create({
          data: {
            societyId,
            notificationType: 'REQUEST_STATUS',
            subject: `Request ${newStatus}`,
            renderedContent: `Your request ${request.requestNumber} (${request.title}) is now ${newStatus}.`,
            priority: 'NORMAL',
            idempotencyKey: `req-${request.id}-${newStatus}-${Date.now()}`,
            recipients: {
              create: [
                {
                  userId: request.resident.userId,
                  readStatus: 'UNREAD',
                },
              ],
            },
          },
        });
      } catch (err) {
        void err;
      }
    }

    return updated;
  }

  async issueRequest(
    societyId: string,
    id: string,
    reviewerUserId: string,
    dto: IssueResidentRequestDto,
  ) {
    const request = await this.prisma.residentRequest.findFirst({
      where: { id, societyId },
      include: { resident: true },
    });
    if (!request) {
      throw new NotFoundException('Resident request not found.');
    }

    if (request.status !== ResidentRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved requests can have certificates/NOCs issued.',
      );
    }

    const issuedDocKey =
      dto.issuedDocumentObjectKey ||
      `${societyId}/issued-docs/${request.id}/certificate.pdf`;

    const updated = await this.prisma.residentRequest.update({
      where: { id },
      data: {
        status: ResidentRequestStatus.ISSUED,
        issuedDocumentObjectKey: issuedDocKey,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: reviewerUserId,
      action: 'REQUEST_ISSUED',
      targetType: 'ResidentRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        requestNumber: request.requestNumber,
        issuedDocumentObjectKey: issuedDocKey,
      },
    });

    if (request.resident.userId) {
      try {
        await this.prisma.notification.create({
          data: {
            societyId,
            notificationType: 'CERTIFICATE_ISSUED',
            subject: 'Certificate / NOC Issued',
            renderedContent: `Your certificate/NOC for request ${request.requestNumber} is ready to download.`,
            priority: 'NORMAL',
            idempotencyKey: `req-iss-${request.id}-${Date.now()}`,
            recipients: {
              create: [
                {
                  userId: request.resident.userId,
                  readStatus: 'UNREAD',
                },
              ],
            },
          },
        });
      } catch (err) {
        void err;
      }
    }

    return updated;
  }
}
