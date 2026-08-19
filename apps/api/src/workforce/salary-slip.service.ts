/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
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
import { PrismaService } from '../prisma/prisma.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';

@Injectable()
export class SalarySlipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PrivateStorageService,
    private readonly config: ConfigService,
  ) {}

  async create(actor: RequestUser, salaryRecordId: string) {
    const record = await this.prisma.salaryRecord.findFirst({
      where: {
        id: salaryRecordId,
        staff: { societyId: actor.societyId },
        status: { in: ['PARTIALLY_PAID', 'PAID'] },
      },
      include: {
        staff: {
          include: {
            society: true,
            employments: {
              where: { effectiveTo: null },
              take: 1,
              include: { department: true, jobTitle: true },
            },
          },
        },
        salaryPeriod: true,
        payments: {
          where: { status: { not: 'REVERSED' } },
          orderBy: { paymentDate: 'asc' },
        },
        adjustments: true,
      },
    });
    if (!record) throw new NotFoundException('Paid salary record not found.');
    const token = randomBytes(32).toString('base64url');
    const number = await this.nextNumber(actor.societyId);
    const verificationUrl = `${this.config.getOrThrow<string>('resident.publicWebUrl')}/verify/salary-slip/${token}`;
    const pdf = await this.render(record, number, verificationUrl);
    const stored = await this.storage.store(
      record.staffId,
      pdf,
      `${number}.pdf`,
      'application/pdf',
    );
    try {
      const slip = await this.prisma.salarySlip.create({
        data: {
          salaryRecordId: record.id,
          slipNumber: number,
          verificationHash: this.digest(token),
          pdfObjectKey: stored.objectKey,
          issuedByUserId: actor.id,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          societyId: actor.societyId,
          actorUserId: actor.id,
          action: 'SALARY_SLIP_GENERATED',
          targetType: 'SalarySlip',
          targetId: slip.id,
          outcome: 'SUCCESS',
          safeMetadata: { salaryRecordId: record.id, slipNumber: number },
        },
      });
      return { ...slip, verificationToken: token };
    } catch (error) {
      await this.storage.remove(stored.objectKey);
      throw error;
    }
  }

  async download(actor: RequestUser, id: string) {
    const slip = await this.prisma.salarySlip.findFirst({
      where: { id, salaryRecord: { staff: { societyId: actor.societyId } } },
    });
    if (!slip) throw new NotFoundException('Salary slip not found.');
    if (!actor.permissions.includes('SALARY_READ'))
      throw new ForbiddenException('Salary-slip access is not permitted.');
    return {
      buffer: await this.storage.read(slip.pdfObjectKey),
      fileName: `${slip.slipNumber}.pdf`,
    };
  }

  async verify(token: string) {
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return { valid: false };
    const slip = await this.prisma.salarySlip.findUnique({
      where: { verificationHash: this.digest(token) },
      include: {
        salaryRecord: {
          include: {
            staff: { include: { society: true } },
            salaryPeriod: true,
          },
        },
      },
    });
    if (!slip) return { valid: false };
    return {
      valid:
        slip.status === 'ACTIVE' && slip.salaryRecord.status !== 'REVERSED',
      slipNumber: slip.slipNumber,
      society: slip.salaryRecord.staff.society.name,
      staffName: slip.salaryRecord.staff.fullName,
      staffNumber: slip.salaryRecord.staff.staffNumber,
      period: `${slip.salaryRecord.salaryPeriod.year}-${String(slip.salaryRecord.salaryPeriod.month).padStart(2, '0')}`,
      netSalary: slip.salaryRecord.netPayable.toFixed(2),
      currency: slip.salaryRecord.currency,
      issuedAt: slip.issuedAt,
      status: slip.status,
    };
  }

  async render(record: any, number: string, verificationUrl: string) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    page.drawText(record.staff.society.name, {
      x: 48,
      y: 785,
      size: 20,
      font: bold,
      color: rgb(0.06, 0.18, 0.32),
    });
    page.drawText('SALARY SLIP', { x: 420, y: 785, size: 13, font: bold });
    const employment = record.staff.employments?.[0];
    const lastPayment = record.payments?.at(-1);
    const lines = [
      `Slip: ${number}`,
      `Staff: ${record.staff.fullName} (${record.staff.staffNumber})`,
      `Department: ${employment?.department.name ?? 'Not assigned'}`,
      `Job title: ${employment?.jobTitle.name ?? 'Not assigned'}`,
      `Period: ${record.salaryPeriod.year}-${String(record.salaryPeriod.month).padStart(2, '0')}`,
      `Basic salary: ${record.currency} ${record.basicSalary.toFixed(2)}`,
      `Allowances: ${record.currency} ${record.allowances.toFixed(2)}`,
      `Deductions: ${record.currency} ${record.deductions.toFixed(2)}`,
      `Adjustments: ${record.currency} ${record.adjustmentTotal.toFixed(2)}`,
      `Net salary: ${record.currency} ${record.netPayable.toFixed(2)}`,
      `Amount paid: ${record.currency} ${record.amountPaid.toFixed(2)}`,
      `Remaining: ${record.currency} ${record.netPayable.sub(record.amountPaid).toFixed(2)}`,
      `Latest method: ${lastPayment?.method?.replaceAll('_', ' ') ?? 'Not paid'}`,
      `Latest payment: ${lastPayment?.paymentDate?.toISOString().slice(0, 10) ?? 'N/A'}`,
    ];
    lines.forEach((line, index) =>
      page.drawText(line, {
        x: 48,
        y: 735 - index * 27,
        size: 10.5,
        font: regular,
      }),
    );
    const qr = await QRCode.toDataURL(verificationUrl, {
      width: 180,
      margin: 1,
    });
    const image = await pdf.embedPng(Buffer.from(qr.split(',')[1], 'base64'));
    page.drawImage(image, { x: 405, y: 65, width: 130, height: 130 });
    page.drawText('Scan to verify this salary slip.', {
      x: 48,
      y: 92,
      size: 9,
      font: regular,
    });
    return Buffer.from(await pdf.save());
  }

  private async nextNumber(societyId: string) {
    const year = new Date().getUTCFullYear();
    const rows = await this.prisma.$queryRaw<Array<{ value: bigint }>>`
      INSERT INTO "salary_slip_sequence" ("society_id","sequence_year","next_value","updated_at")
      VALUES (${societyId}::uuid,${year},2,CURRENT_TIMESTAMP)
      ON CONFLICT ("society_id","sequence_year") DO UPDATE SET
        "next_value"="salary_slip_sequence"."next_value"+1,"updated_at"=CURRENT_TIMESTAMP
      RETURNING "next_value"-1 AS "value"`;
    return `SAL-${year}-${rows[0].value.toString().padStart(6, '0')}`;
  }

  private digest(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
