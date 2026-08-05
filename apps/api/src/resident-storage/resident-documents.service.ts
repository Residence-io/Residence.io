import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type ResidentDocumentCategory,
} from '../generated/prisma/client';
import type { RequestUser } from '../common/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { PrivateStorageService } from './private-storage.service';

@Injectable()
export class ResidentDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PrivateStorageService,
  ) {}

  async list(actor: RequestUser, residentId: string) {
    await this.assertAccess(actor, residentId);
    return this.prisma.residentDocument
      .findMany({
        where: { residentId, status: { not: 'ARCHIVED' } },
        select: {
          id: true,
          category: true,
          status: true,
          originalFileName: true,
          mediaType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) =>
        rows.map((row) => ({ ...row, sizeBytes: Number(row.sizeBytes) })),
      );
  }

  async upload(
    actor: RequestUser,
    residentId: string,
    category: string,
    file?: Express.Multer.File,
    replaceId?: string,
  ) {
    await this.assertAccess(actor, residentId, true);
    if (!file) throw new BadRequestException('Select a file to upload.');
    if (
      ![
        'PROFILE_PHOTOGRAPH',
        'IDENTITY_DOCUMENT',
        'OWNERSHIP_DOCUMENT',
        'TENANCY_AGREEMENT',
        'OTHER',
      ].includes(category)
    )
      throw new BadRequestException('Select a valid document category.');
    const stored = await this.storage.store(
      residentId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    try {
      const document = await this.prisma.$transaction(async (tx) => {
        if (replaceId) {
          const previous = await tx.residentDocument.findFirst({
            where: { id: replaceId, residentId, status: 'ACTIVE' },
          });
          if (!previous)
            throw new NotFoundException(
              'The document to replace was not found.',
            );
          await tx.residentDocument.update({
            where: { id: previous.id },
            data: {
              status: 'REPLACED',
              archivedAt: new Date(),
              version: { increment: 1 },
            },
          });
        }
        const created = await tx.residentDocument.create({
          data: {
            residentId,
            category: category as ResidentDocumentCategory,
            uploadedByUserId: actor.id,
            replacedById: replaceId,
            ...stored,
            sizeBytes: BigInt(stored.sizeBytes),
          },
        });
        if (category === 'PROFILE_PHOTOGRAPH')
          await tx.resident.update({
            where: { id: residentId },
            data: {
              profilePhotographObjectKey: stored.objectKey,
              version: { increment: 1 },
            },
          });
        await tx.auditLog.create({
          data: {
            societyId: actor.societyId,
            actorUserId: actor.id,
            action: replaceId
              ? 'RESIDENT_DOCUMENT_REPLACED'
              : 'RESIDENT_DOCUMENT_UPLOADED',
            targetType: 'ResidentDocument',
            targetId: created.id,
            outcome: 'SUCCESS',
            safeMetadata: { residentId, category, sizeBytes: stored.sizeBytes },
          },
        });
        return created;
      });
      return {
        id: document.id,
        category: document.category,
        status: document.status,
        originalFileName: document.originalFileName,
        mediaType: document.mediaType,
        sizeBytes: Number(document.sizeBytes),
        createdAt: document.createdAt,
      };
    } catch (error) {
      await this.storage.remove(stored.objectKey);
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        throw new BadRequestException('The document could not be stored.');
      throw error;
    }
  }

  async download(actor: RequestUser, residentId: string, documentId: string) {
    await this.assertAccess(actor, residentId);
    const document = await this.prisma.residentDocument.findFirst({
      where: { id: documentId, residentId, status: 'ACTIVE' },
    });
    if (!document) throw new NotFoundException('Document not found.');
    const buffer = await this.storage.read(document.objectKey);
    await this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action: 'RESIDENT_DOCUMENT_DOWNLOADED',
        targetType: 'ResidentDocument',
        targetId: document.id,
        outcome: 'SUCCESS',
        safeMetadata: { residentId, category: document.category },
      },
    });
    return {
      buffer,
      mediaType: document.mediaType,
      fileName: document.originalFileName,
    };
  }

  async archive(
    actor: RequestUser,
    residentId: string,
    documentId: string,
    reason: string,
  ) {
    await this.assertAccess(actor, residentId, true);
    const result = await this.prisma.residentDocument.updateMany({
      where: { id: documentId, residentId, status: 'ACTIVE' },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (!result.count) throw new NotFoundException('Document not found.');
    await this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action: 'RESIDENT_DOCUMENT_ARCHIVED',
        targetType: 'ResidentDocument',
        targetId: documentId,
        outcome: 'SUCCESS',
        reason,
        safeMetadata: { residentId },
      },
    });
  }

  private async assertAccess(
    actor: RequestUser,
    residentId: string,
    manage = false,
  ) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId: actor.societyId },
      select: { userId: true },
    });
    if (!resident) throw new NotFoundException('Resident not found.');
    const permission = manage
      ? 'RESIDENT_DOCUMENT_MANAGE'
      : 'RESIDENT_DOCUMENT_READ';
    if (resident.userId !== actor.id && !actor.permissions.includes(permission))
      throw new ForbiddenException('You cannot access this resident document.');
  }
}
