import { createHash, randomBytes } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
import QRCode from 'qrcode';
import type { RequestUser } from '../common/request-context';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';
import { money } from './financial-calculator';

interface ReceiptPaymentData {
  id: string;
  society: { name: string };
  resident: {
    fullName: string;
    residentNumber: string;
    occupancies: Array<{
      unit: { unitNumber: string; property: { block: string } };
    }>;
    creditBalance: { amount: Prisma.Decimal } | null;
    monthlyDues: Array<{
      totalAmount: Prisma.Decimal;
      paidAmount: Prisma.Decimal;
      waivedAmount: Prisma.Decimal;
    }>;
  };
  paymentDate: Date;
  method: string;
  transactionReference: string | null;
  currency: string;
  amount: { toFixed(decimalPlaces: number): string };
  allocations: Array<{
    amount: { toFixed(decimalPlaces: number): string };
    monthlyDue: { billingPeriod: { year: number; month: number } };
  }>;
}

@Injectable()
export class ReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PrivateStorageService,
    private readonly config: ConfigService,
  ) {}
  async createForPayment(paymentId: string, issuerId: string) {
    const existing = await this.prisma.receipt.findUnique({
      where: { paymentId },
    });
    if (existing) return existing;
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        society: true,
        resident: {
          include: {
            occupancies: {
              where: { endDate: null },
              take: 1,
              include: { unit: { include: { property: true } } },
            },
            creditBalance: true,
            monthlyDues: {
              where: {
                status: {
                  in: ['UPCOMING', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE'],
                },
              },
              select: {
                totalAmount: true,
                paidAmount: true,
                waivedAmount: true,
              },
            },
          },
        },
        allocations: {
          include: { monthlyDue: { include: { billingPeriod: true } } },
        },
      },
    });
    if (!payment || payment.status !== 'CONFIRMED')
      throw new NotFoundException(
        'A confirmed payment is required for receipt generation.',
      );
    const token = randomBytes(32).toString('base64url');
    const receiptNumber = await this.nextNumber(payment.societyId);
    const verificationUrl = `${this.config.getOrThrow<string>('resident.publicWebUrl')}/verify/receipt/${token}`;
    const issuer = await this.prisma.userAccount.findUnique({
      where: { id: issuerId },
      select: { displayName: true },
    });
    const pdf = await this.render(
      payment,
      receiptNumber,
      verificationUrl,
      issuer?.displayName ?? 'Residence.io',
    );
    const stored = await this.storage.store(
      payment.residentId,
      pdf,
      `${receiptNumber}.pdf`,
      'application/pdf',
    );
    try {
      return await this.prisma.receipt.create({
        data: {
          paymentId,
          receiptNumber,
          verificationHash: this.digest(token),
          pdfObjectKey: stored.objectKey,
          issuedByUserId: issuerId,
        },
      });
    } catch (error) {
      await this.storage.remove(stored.objectKey);
      throw error;
    }
  }
  async download(actor: RequestUser, receiptId: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id: receiptId, payment: { societyId: actor.societyId } },
      include: { payment: { include: { resident: true } } },
    });
    if (!receipt) throw new NotFoundException('Receipt not found.');
    if (
      receipt.payment.resident.userId !== actor.id &&
      !actor.permissions.includes('BILLING_DUE_READ')
    )
      throw new ForbiddenException('Receipt access is not permitted.');
    return {
      buffer: await this.storage.read(receipt.pdfObjectKey),
      fileName: `${receipt.receiptNumber}.pdf`,
    };
  }
  async verify(token: string) {
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return { valid: false };
    const receipt = await this.prisma.receipt.findUnique({
      where: { verificationHash: this.digest(token) },
      include: { payment: true },
    });
    if (!receipt) return { valid: false };
    return {
      valid:
        receipt.status === 'ACTIVE' && receipt.payment.status !== 'REVERSED',
      receiptNumber: receipt.receiptNumber,
      status: receipt.status,
      amount: receipt.payment.amount.toFixed(2),
      currency: receipt.payment.currency,
      issuedAt: receipt.issuedAt,
    };
  }
  private async nextNumber(societyId: string) {
    const year = new Date().getUTCFullYear();
    const rows = await this.prisma.$queryRaw<
      Array<{ value: bigint }>
    >`INSERT INTO "receipt_sequence" ("society_id", "sequence_year", "next_value", "updated_at") VALUES (${societyId}::uuid, ${year}, 2, now()) ON CONFLICT ("society_id", "sequence_year") DO UPDATE SET "next_value" = "receipt_sequence"."next_value" + 1, "updated_at" = now() RETURNING "next_value" - 1 AS value`;
    return `RCT-${year}-${rows[0].value.toString().padStart(6, '0')}`;
  }
  private digest(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
  async render(
    payment: ReceiptPaymentData,
    receiptNumber: string,
    verificationUrl: string,
    issuerName = 'Residence.io',
  ) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    page.drawText(payment.society.name, {
      x: 48,
      y: 785,
      size: 20,
      font: bold,
      color: rgb(0.06, 0.18, 0.32),
    });
    page.drawText('PAYMENT RECEIPT', { x: 390, y: 785, size: 13, font: bold });
    const occupancy = payment.resident.occupancies[0];
    const unit = occupancy
      ? `${occupancy.unit.property.block} / ${occupancy.unit.unitNumber}`
      : 'Not assigned';
    const remaining = payment.resident.monthlyDues.reduce(
      (sum, due) =>
        sum.add(due.totalAmount.sub(due.paidAmount).sub(due.waivedAmount)),
      money(0),
    );
    const lines = [
      `Receipt: ${receiptNumber}`,
      `Resident: ${payment.resident.fullName} (${payment.resident.residentNumber})`,
      `Unit: ${unit}`,
      `Payment date: ${payment.paymentDate.toISOString().slice(0, 10)}`,
      `Method: ${payment.method.replaceAll('_', ' ')}`,
      `Reference: ${payment.transactionReference ?? payment.id}`,
      `Amount received: ${payment.currency} ${payment.amount.toFixed(2)}`,
      `Remaining balance: ${payment.currency} ${remaining.toFixed(2)}`,
      `Advance balance: ${payment.currency} ${payment.resident.creditBalance?.amount.toFixed(2) ?? '0.00'}`,
      `Issued by: ${issuerName}`,
    ];
    lines.forEach((line, index) =>
      page.drawText(line, {
        x: 48,
        y: 730 - index * 28,
        size: 11,
        font: regular,
      }),
    );
    page.drawText('Allocations', { x: 48, y: 410, size: 13, font: bold });
    payment.allocations.forEach((allocation, index) =>
      page.drawText(
        `${allocation.monthlyDue.billingPeriod.year}-${String(allocation.monthlyDue.billingPeriod.month).padStart(2, '0')}    ${payment.currency} ${allocation.amount.toFixed(2)}`,
        { x: 48, y: 382 - index * 22, size: 10, font: regular },
      ),
    );
    const qr = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 180,
    });
    const image = await pdf.embedPng(Buffer.from(qr.split(',')[1], 'base64'));
    page.drawImage(image, { x: 405, y: 70, width: 130, height: 130 });
    page.drawText('Verify this receipt using the QR code.', {
      x: 48,
      y: 90,
      size: 9,
      font: regular,
    });
    return Buffer.from(await pdf.save());
  }
}
