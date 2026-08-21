import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';
import { ResidentDocumentCategory } from '../generated/prisma/client';

@Injectable()
export class ResidentDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: PrivateStorageService,
  ) {}

  async getResidentDocuments(societyId: string, residentId: string) {
    const docs = await this.prisma.residentDocument.findMany({
      where: {
        residentId,
        resident: { societyId },
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return docs.map((doc) => {
      let dynamicStatus = doc.verificationStatus;
      if (doc.expiresAt) {
        const exp = new Date(doc.expiresAt);
        if (exp < now) {
          dynamicStatus = 'EXPIRED';
        } else if (exp <= thirtyDaysFromNow) {
          dynamicStatus = 'EXPIRING_SOON';
        }
      }
      return {
        ...doc,
        computedStatus: dynamicStatus,
      };
    });
  }

  async uploadResidentDocument(
    societyId: string,
    residentId: string,
    userId: string,
    category: ResidentDocumentCategory,
    fileBuffer: Buffer,
    originalFileName: string,
    mediaType: string,
    documentNumber?: string,
    issuedAt?: string,
    expiresAt?: string,
  ) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found.');
    }

    const stored = await this.storage.store(
      residentId,
      fileBuffer,
      originalFileName,
      mediaType,
      societyId,
    );

    const doc = await this.prisma.residentDocument.create({
      data: {
        residentId,
        category,
        objectKey: stored.objectKey,
        originalFileName: stored.originalFileName,
        mediaType: stored.mediaType,
        sizeBytes: BigInt(stored.sizeBytes),
        checksumSha256: stored.checksumSha256,
        uploadedByUserId: userId,
        documentNumber,
        issuedAt: issuedAt ? new Date(issuedAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        verificationStatus: 'PENDING',
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'RESIDENT_DOCUMENT_UPLOADED',
      targetType: 'ResidentDocument',
      targetId: doc.id,
      outcome: 'SUCCESS',
      safeMetadata: { category, originalFileName, documentNumber },
    });

    return doc;
  }

  async reviewDocument(
    societyId: string,
    docId: string,
    reviewerUserId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string,
  ) {
    const doc = await this.prisma.residentDocument.findFirst({
      where: { id: docId, resident: { societyId } },
      include: { resident: true },
    });
    if (!doc) {
      throw new NotFoundException('Resident document not found.');
    }

    const updated = await this.prisma.residentDocument.update({
      where: { id: docId },
      data: {
        verificationStatus: status,
        verifiedByUserId: reviewerUserId,
        verifiedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: reviewerUserId,
      action:
        status === 'VERIFIED'
          ? 'RESIDENT_DOCUMENT_VERIFIED'
          : 'RESIDENT_DOCUMENT_REJECTED',
      targetType: 'ResidentDocument',
      targetId: doc.id,
      outcome: 'SUCCESS',
      safeMetadata: { verificationStatus: status, rejectionReason },
    });

    if (doc.resident.userId) {
      try {
        await this.prisma.notification.create({
          data: {
            societyId,
            notificationType: 'DOCUMENT_STATUS',
            subject: `Document ${status === 'VERIFIED' ? 'Verified' : 'Rejected'}`,
            renderedContent:
              status === 'VERIFIED'
                ? `Your document "${doc.originalFileName}" has been verified.`
                : `Your document "${doc.originalFileName}" was rejected. Reason: ${rejectionReason || 'No reason provided'}`,
            priority: 'NORMAL',
            idempotencyKey: `doc-${doc.id}-${status}-${Date.now()}`,
            recipients: {
              create: [
                {
                  userId: doc.resident.userId,
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
