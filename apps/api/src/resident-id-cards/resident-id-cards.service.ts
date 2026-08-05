import { createHash, randomBytes } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import type { RequestUser } from '../common/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';

@Injectable()
export class ResidentIDCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PrivateStorageService,
    private readonly config: ConfigService,
  ) {}

  async generate(
    actor: RequestUser,
    residentId: string,
    reason = 'Initial generation',
  ) {
    if (!actor.permissions.includes('RESIDENT_ID_CARD_MANAGE'))
      throw new ForbiddenException('ID-card generation is not permitted.');
    const resident = await this.resident(actor, residentId);
    const token = randomBytes(32).toString('base64url');
    const verificationHash = this.digest(token);
    const verificationUrl = `${this.config.getOrThrow<string>('resident.publicWebUrl')}/verify/card/${token}`;
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
    const cardNumber = `${resident.residentNumber}-CARD-${randomBytes(5).toString('hex').toUpperCase()}`;
    const pdf = await this.renderPdf(
      resident,
      verificationUrl,
      issuedAt,
      expiresAt,
      cardNumber,
    );
    const stored = await this.storage.store(
      residentId,
      pdf,
      `${cardNumber}.pdf`,
      'application/pdf',
    );
    try {
      const card = await this.prisma.$transaction(async (tx) => {
        await tx.residentIDCard.updateMany({
          where: { residentId, status: 'ACTIVE' },
          data: {
            status: 'REVOKED',
            revokedAt: issuedAt,
            revocationReason: reason,
            version: { increment: 1 },
          },
        });
        const created = await tx.residentIDCard.create({
          data: {
            residentId,
            cardNumber,
            verificationHash,
            pdfObjectKey: stored.objectKey,
            issuedAt,
            expiresAt,
          },
        });
        await tx.auditLog.create({
          data: {
            societyId: actor.societyId,
            actorUserId: actor.id,
            action: 'RESIDENT_ID_CARD_GENERATED',
            targetType: 'ResidentIDCard',
            targetId: created.id,
            outcome: 'SUCCESS',
            reason,
            safeMetadata: {
              residentId,
              cardNumber,
              expiresAt: expiresAt.toISOString(),
            },
          },
        });
        return created;
      });
      return {
        id: card.id,
        cardNumber: card.cardNumber,
        status: card.status,
        issuedAt,
        expiresAt,
      };
    } catch (error) {
      await this.storage.remove(stored.objectKey);
      throw error;
    }
  }

  async revoke(actor: RequestUser, residentId: string, reason: string) {
    if (!actor.permissions.includes('RESIDENT_ID_CARD_MANAGE'))
      throw new ForbiddenException('ID-card revocation is not permitted.');
    await this.resident(actor, residentId);
    const card = await this.prisma.residentIDCard.findFirst({
      where: { residentId, status: 'ACTIVE' },
      orderBy: { issuedAt: 'desc' },
    });
    if (!card) throw new NotFoundException('No active ID card was found.');
    await this.prisma.$transaction([
      this.prisma.residentIDCard.update({
        where: { id: card.id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revocationReason: reason,
          version: { increment: 1 },
        },
      }),
      this.prisma.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: 'RESIDENT_ID_CARD_REVOKED',
          targetType: 'ResidentIDCard',
          targetId: card.id,
          outcome: 'SUCCESS',
          reason,
          safeMetadata: { residentId },
        },
      }),
    ]);
  }

  async download(actor: RequestUser, residentId: string) {
    const resident = await this.resident(actor, residentId);
    if (
      resident.userId !== actor.id &&
      !actor.permissions.includes('RESIDENT_READ')
    )
      throw new ForbiddenException('ID-card access is not permitted.');
    const card = await this.prisma.residentIDCard.findFirst({
      where: { residentId, status: 'ACTIVE' },
      orderBy: { issuedAt: 'desc' },
    });
    if (!card) throw new NotFoundException('No active ID card was found.');
    return {
      buffer: await this.storage.read(card.pdfObjectKey),
      fileName: `${card.cardNumber}.pdf`,
    };
  }

  async verify(token: string) {
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return { valid: false };
    const card = await this.prisma.residentIDCard.findUnique({
      where: { verificationHash: this.digest(token) },
      include: {
        resident: {
          include: {
            society: { select: { name: true } },
            occupancies: {
              where: { endDate: null },
              take: 1,
              include: { unit: { include: { property: true } } },
            },
          },
        },
      },
    });
    if (!card) return { valid: false };
    const active =
      card.status === 'ACTIVE' &&
      (!card.expiresAt || card.expiresAt > new Date()) &&
      card.resident.status === 'ACTIVE';
    const occupancy = card.resident.occupancies[0];
    return {
      valid: active,
      status: active ? 'VALID' : card.status,
      residentName: card.resident.fullName,
      residentNumber: card.resident.residentNumber,
      societyName: card.resident.society.name,
      unit: occupancy
        ? `${occupancy.unit.property.block} / ${occupancy.unit.unitNumber}`
        : null,
      expiresAt: card.expiresAt,
    };
  }

  private async resident(actor: RequestUser, residentId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId: actor.societyId },
      include: {
        society: { select: { name: true } },
        occupancies: {
          where: { endDate: null },
          take: 1,
          include: { unit: { include: { property: true } } },
        },
      },
    });
    if (!resident) throw new NotFoundException('Resident not found.');
    return resident;
  }

  private digest(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async renderPdf(
    resident: Awaited<ReturnType<ResidentIDCardsService['resident']>>,
    verificationUrl: string,
    issuedAt: Date,
    expiresAt: Date,
    cardNumber: string,
  ): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const width = 242.65;
    const height = 153.01;
    const page = pdf.addPage([width, height]);
    const back = pdf.addPage([width, height]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const qr = await pdf.embedPng(
      await QRCode.toBuffer(verificationUrl, {
        type: 'png',
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'M',
      }),
    );
    const occupancy = resident.occupancies[0];
    const unit = occupancy
      ? `${occupancy.unit.property.block} / ${occupancy.unit.unitNumber}`
      : 'No active unit';
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.97, 0.98, 1),
    });
    page.drawRectangle({
      x: 0,
      y: height - 34,
      width,
      height: 34,
      color: rgb(0.05, 0.16, 0.32),
    });
    page.drawText(resident.society.name.slice(0, 34), {
      x: 12,
      y: height - 22,
      size: 12,
      font: bold,
      color: rgb(1, 1, 1),
    });
    page.drawText('RESIDENT ID CARD', {
      x: 12,
      y: height - 31,
      size: 6.5,
      font: regular,
      color: rgb(0.75, 0.86, 1),
    });
    page.drawRectangle({
      x: 12,
      y: 48,
      width: 55,
      height: 64,
      borderColor: rgb(0.65, 0.7, 0.78),
      borderWidth: 1,
      color: rgb(0.9, 0.92, 0.95),
    });
    page.drawText('PHOTO', {
      x: 28,
      y: 77,
      size: 8,
      font: bold,
      color: rgb(0.35, 0.4, 0.48),
    });
    page.drawText(resident.fullName.slice(0, 28), {
      x: 78,
      y: 100,
      size: 11,
      font: bold,
      color: rgb(0.05, 0.12, 0.22),
    });
    page.drawText(resident.residentNumber, {
      x: 78,
      y: 84,
      size: 8.5,
      font: regular,
    });
    page.drawText(unit.slice(0, 30), {
      x: 78,
      y: 69,
      size: 8.5,
      font: regular,
    });
    page.drawText(resident.occupancies[0]?.occupancyType ?? 'NO OCCUPANCY', {
      x: 78,
      y: 54,
      size: 8.5,
      font: bold,
    });
    page.drawText(
      `Issued ${issuedAt.toISOString().slice(0, 10)}  •  Expires ${expiresAt.toISOString().slice(0, 10)}`,
      { x: 12, y: 18, size: 6.5, font: regular, color: rgb(0.25, 0.3, 0.4) },
    );
    back.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.97, 0.98, 1),
    });
    back.drawImage(qr, { x: 12, y: 45, width: 82, height: 82 });
    back.drawText('Scan to verify card validity', {
      x: 105,
      y: 112,
      size: 9,
      font: bold,
    });
    back.drawText('The QR code contains only an opaque', {
      x: 105,
      y: 96,
      size: 6.5,
      font: regular,
    });
    back.drawText('verification token. No private identity', {
      x: 105,
      y: 86,
      size: 6.5,
      font: regular,
    });
    back.drawText('or contact information is embedded.', {
      x: 105,
      y: 76,
      size: 6.5,
      font: regular,
    });
    back.drawText(`Card: ${cardNumber}`.slice(0, 42), {
      x: 105,
      y: 55,
      size: 6.5,
      font: regular,
    });
    back.drawText('Authorized signatory: __________________', {
      x: 105,
      y: 28,
      size: 6.5,
      font: regular,
    });
    return Buffer.from(await pdf.save());
  }
}
