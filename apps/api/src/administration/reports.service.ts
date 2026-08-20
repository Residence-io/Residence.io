/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-base-to-string */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import type { RequestUser } from '../common/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { csvCell, redactAuditValue } from './administration-policy';
import {
  dashboardWindow,
  monthlySeries,
  type DashboardPeriod,
} from './dashboard-period';
import type {
  DashboardPeriodDto,
  PageQueryDto,
} from './dto/administration.dto';

export const REPORTS = [
  ['resident-directory', 'Resident directory'],
  ['resident-status', 'Resident status'],
  ['occupancy', 'Property occupancy and vacancy'],
  ['dues', 'Monthly dues summary'],
  ['aging', 'Outstanding dues and aging'],
  ['payments', 'Payment collection'],
  ['payment-methods', 'Payment-method breakdown'],
  ['adjustments', 'Adjustments and reversals'],
  ['receipts', 'Receipt register'],
  ['credits', 'Advance-credit balances'],
  ['workforce', 'Staff and worker directory'],
  ['salaries', 'Salary payment status'],
  ['complaints', 'Complaint volume and status'],
  ['maintenance', 'Maintenance requests'],
  ['worker-workload', 'Worker assignment and workload'],
  ['sla', 'SLA compliance'],
  ['notification-delivery', 'Notification delivery summary'],
  ['notification-failures', 'Failed notification deliveries'],
  ['audit', 'Audit activity'],
] as const;
export type ReportCode = (typeof REPORTS)[number][0];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  catalog(actor: RequestUser) {
    return REPORTS.filter(([code]) => this.hasReportAccess(actor, code)).map(
      ([code, name]) => ({ code, name }),
    );
  }

  async run(
    actor: RequestUser,
    code: string,
    query: PageQueryDto,
    exportLimit?: number,
  ) {
    if (!REPORTS.some(([candidate]) => candidate === code))
      throw new NotFoundException('Report not found.');
    this.assertReportAccess(actor, code);
    const take = exportLimit ?? query.pageSize;
    const skip = exportLimit ? 0 : (query.page - 1) * query.pageSize;
    const prisma = this.prisma as any;
    const common = { societyId: actor.societyId };
    let items: any[] = [];
    let total = 0;
    const text = query.search?.trim();
    const dates =
      query.from || query.to
        ? {
            gte: query.from ? new Date(query.from) : undefined,
            lte: query.to ? new Date(query.to) : undefined,
          }
        : undefined;

    if (code === 'resident-directory' || code === 'resident-status') {
      const where = {
        ...common,
        archivedAt: null,
        ...(query.status ? { status: query.status } : {}),
        ...(text
          ? {
              OR: [
                { residentNumber: { contains: text, mode: 'insensitive' } },
                { fullName: { contains: text, mode: 'insensitive' } },
                { primaryPhone: { contains: text } },
              ],
            }
          : {}),
      };
      [total, items] = await Promise.all([
        prisma.resident.count({ where }),
        prisma.resident.findMany({
          where,
          select: {
            residentNumber: true,
            fullName: true,
            primaryPhone: true,
            email: true,
            status: true,
            createdAt: true,
            occupancies: {
              where: { endDate: null },
              select: {
                occupancyType: true,
                unit: {
                  select: {
                    unitNumber: true,
                    property: { select: { block: true } },
                  },
                },
              },
            },
          },
          orderBy: [{ residentNumber: 'asc' }],
          skip,
          take,
        }),
      ]);
    } else if (code === 'occupancy') {
      const where = {
        property: {
          societyId: actor.societyId,
          ...(query.block ? { block: query.block } : {}),
        },
        archivedAt: null,
      };
      [total, items] = await Promise.all([
        prisma.unit.count({ where }),
        prisma.unit.findMany({
          where,
          select: {
            unitNumber: true,
            status: true,
            property: { select: { name: true, block: true, type: true } },
            occupancies: {
              where: { endDate: null },
              select: {
                occupancyType: true,
                resident: { select: { residentNumber: true, fullName: true } },
              },
            },
          },
          orderBy: [{ property: { block: 'asc' } }, { unitNumber: 'asc' }],
          skip,
          take,
        }),
      ]);
    } else if (code === 'dues' || code === 'aging') {
      const where = {
        resident: { societyId: actor.societyId },
        ...(query.status ? { status: query.status } : {}),
        ...(dates ? { dueDate: dates } : {}),
      };
      [total, items] = await Promise.all([
        prisma.monthlyDue.count({ where }),
        prisma.monthlyDue.findMany({
          where,
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            waivedAmount: true,
            dueDate: true,
            resident: { select: { residentNumber: true, fullName: true } },
            billingPeriod: { select: { year: true, month: true } },
          },
          orderBy: [{ dueDate: 'desc' }],
          skip,
          take,
        }),
      ]);
    } else if (code === 'payments' || code === 'payment-methods') {
      const where = {
        societyId: actor.societyId,
        ...(query.status ? { status: query.status } : {}),
        ...(dates ? { paymentDate: dates } : {}),
      };
      [total, items] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            status: true,
            paymentDate: true,
            transactionReference: true,
            resident: { select: { residentNumber: true, fullName: true } },
          },
          orderBy: [{ paymentDate: 'desc' }],
          skip,
          take,
        }),
      ]);
    } else if (code === 'adjustments') {
      const where = {
        monthlyDue: { societyId: actor.societyId },
        ...(dates ? { createdAt: dates } : {}),
      };
      [total, items] = await Promise.all([
        prisma.paymentAdjustment.count({ where }),
        prisma.paymentAdjustment.findMany({
          where,
          select: {
            type: true,
            amount: true,
            reason: true,
            createdAt: true,
            monthlyDue: {
              select: {
                billingPeriod: { select: { year: true, month: true } },
                resident: { select: { residentNumber: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);
    } else if (code === 'receipts') {
      const where = {
        payment: { societyId: actor.societyId },
        ...(query.status ? { status: query.status } : {}),
        ...(dates ? { issuedAt: dates } : {}),
      };
      [total, items] = await Promise.all([
        prisma.receipt.count({ where }),
        prisma.receipt.findMany({
          where,
          select: {
            receiptNumber: true,
            status: true,
            issuedAt: true,
            payment: {
              select: {
                id: true,
                amount: true,
                currency: true,
                resident: { select: { residentNumber: true, fullName: true } },
              },
            },
          },
          orderBy: { issuedAt: 'desc' },
          skip,
          take,
        }),
      ]);
    } else if (code === 'credits') {
      const where = { resident: { societyId: actor.societyId } };
      [total, items] = await Promise.all([
        prisma.residentCreditBalance.count({ where }),
        prisma.residentCreditBalance.findMany({
          where,
          select: {
            amount: true,
            currency: true,
            updatedAt: true,
            resident: { select: { residentNumber: true, fullName: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
      ]);
    } else if (code === 'workforce') {
      const [staff, workers] = await Promise.all([
        prisma.staffMember.findMany({
          where: { societyId: actor.societyId, archivedAt: null },
          select: {
            staffNumber: true,
            fullName: true,
            primaryPhone: true,
            status: true,
            employments: {
              where: { effectiveTo: null },
              take: 1,
              select: {
                employmentType: true,
                department: { select: { name: true } },
                jobTitle: { select: { name: true } },
              },
            },
          },
          take: Math.ceil(take / 2),
          orderBy: { staffNumber: 'asc' },
        }),
        prisma.serviceWorker.findMany({
          where: { societyId: actor.societyId, archivedAt: null },
          select: {
            workerNumber: true,
            fullName: true,
            primaryPhone: true,
            status: true,
            relationship: true,
            primaryCategory: { select: { name: true } },
          },
          take: Math.ceil(take / 2),
          orderBy: { workerNumber: 'asc' },
        }),
      ]);
      items = [
        ...staff.map((x: any) => ({ type: 'STAFF', ...x })),
        ...workers.map((x: any) => ({ type: 'WORKER', ...x })),
      ];
      total =
        (await prisma.staffMember.count({
          where: { societyId: actor.societyId },
        })) +
        (await prisma.serviceWorker.count({
          where: { societyId: actor.societyId },
        }));
    } else if (code === 'salaries') {
      const where = {
        staff: { societyId: actor.societyId },
        ...(query.status ? { status: query.status } : {}),
      };
      [total, items] = await Promise.all([
        prisma.salaryRecord.count({ where }),
        prisma.salaryRecord.findMany({
          where,
          select: {
            status: true,
            netPayable: true,
            amountPaid: true,
            currency: true,
            staff: { select: { staffNumber: true, fullName: true } },
            salaryPeriod: { select: { year: true, month: true } },
          },
          orderBy: { generatedAt: 'desc' },
          skip,
          take,
        }),
      ]);
    } else if (code === 'complaints' || code === 'maintenance') {
      const model =
        code === 'complaints' ? prisma.complaint : prisma.maintenanceRequest;
      const where = {
        societyId: actor.societyId,
        ...(query.status ? { status: query.status } : {}),
        ...(dates ? { createdAt: dates } : {}),
      };
      [total, items] = await Promise.all([
        model.count({ where }),
        model.findMany({
          where,
          select: {
            ticketNumber: true,
            subject: true,
            status: true,
            priority: true,
            targetResponseAt: true,
            targetResolutionAt: true,
            createdAt: true,
            resident: { select: { residentNumber: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);
    } else if (code === 'worker-workload') {
      const where = { request: { societyId: actor.societyId } };
      [total, items] = await Promise.all([
        prisma.workerAssignment.count({ where }),
        prisma.workerAssignment.findMany({
          where,
          select: {
            status: true,
            assignedAt: true,
            endedAt: true,
            worker: {
              select: { workerNumber: true, fullName: true, status: true },
            },
            request: { select: { ticketNumber: true, subject: true } },
          },
          orderBy: { assignedAt: 'desc' },
          skip,
          take,
        }),
      ]);
    } else if (code === 'sla') {
      const now = new Date();
      const complaints = await prisma.complaint.findMany({
        where: {
          societyId: actor.societyId,
          OR: [
            { targetResponseAt: { lt: now }, respondedAt: null },
            { targetResolutionAt: { lt: now }, resolvedAt: null },
          ],
        },
        select: {
          ticketNumber: true,
          subject: true,
          status: true,
          targetResponseAt: true,
          targetResolutionAt: true,
        },
        orderBy: { targetResolutionAt: 'asc' },
        skip,
        take,
      });
      items = complaints;
      total = complaints.length;
    } else if (
      code === 'notification-delivery' ||
      code === 'notification-failures'
    ) {
      const where = {
        recipient: { notification: { societyId: actor.societyId } },
        ...(code === 'notification-failures' ? { status: 'FAILED' } : {}),
        ...(query.status ? { status: query.status } : {}),
      };
      [total, items] = await Promise.all([
        prisma.notificationDelivery.count({ where }),
        prisma.notificationDelivery.findMany({
          where,
          select: {
            channel: true,
            status: true,
            destinationMasked: true,
            retryCount: true,
            failureClassification: true,
            failureReason: true,
            createdAt: true,
            recipient: {
              select: {
                notification: {
                  select: { notificationType: true, subject: true },
                },
                user: { select: { username: true, displayName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);
    } else {
      const where = {
        societyId: actor.societyId,
        ...(dates ? { createdAt: dates } : {}),
      };
      [total, items] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          select: {
            action: true,
            targetType: true,
            targetId: true,
            outcome: true,
            reason: true,
            safeMetadata: true,
            createdAt: true,
            actor: { select: { username: true, displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);
      items = items.map((item) => ({
        ...item,
        safeMetadata: redactAuditValue(item.safeMetadata),
      }));
    }
    return {
      code,
      items,
      total,
      page: exportLimit ? 1 : query.page,
      pageSize: take,
      summary: { records: total },
    };
  }

  async csv(actor: RequestUser, code: string, query: PageQueryDto) {
    const report = await this.run(actor, code, query, 5000);
    const flat = report.items.map((item: any) => this.flatten(item));
    const columns = Array.from(
      new Set(flat.flatMap((item: any) => Object.keys(item))),
    );
    const lines = [
      columns.map(csvCell).join(','),
      ...flat.map((item: any) =>
        columns.map((column) => csvCell(item[column])).join(','),
      ),
    ];
    await this.prisma.auditLog.create({
      data: {
        societyId: actor.societyId,
        actorUserId: actor.id,
        action: 'REPORT_EXPORTED',
        targetType: 'Report',
        targetId: code,
        outcome: 'SUCCESS',
        safeMetadata: { format: 'CSV', rowCount: flat.length, bounded: true },
      },
    });
    return `\uFEFF${lines.join('\r\n')}`;
  }

  async adminDashboard(actor: RequestUser, query: DashboardPeriodDto) {
    const p = this.prisma as any;
    const societyId = actor.societyId;
    const now = new Date();
    const period = query.period as DashboardPeriod;
    const window = dashboardWindow(period, now);
    const canFinance = actor.permissions.includes('BILLING_DUE_READ');
    const canSalary = actor.permissions.includes('SALARY_READ');
    const canTickets = actor.permissions.some((permission) =>
      ['COMPLAINT_READ', 'MAINTENANCE_READ'].includes(permission),
    );
    const canNotifications = actor.permissions.includes(
      'NOTIFICATION_LOG_READ',
    );
    const [
      society,
      totalResidents,
      activeResidents,
      occupiedUnits,
      vacantUnits,
      received,
      outstanding,
      overdueDues,
      openComplaints,
      overdueComplaints,
      pendingMaintenance,
      availableWorkers,
      assignedWorkers,
      pendingSalary,
      unreadNotifications,
      failedDeliveries,
      paymentRows,
      dueRows,
      complaintStatus,
      workerStatus,
      notificationDelivery,
    ] = await Promise.all([
      p.society.findUnique({
        where: { id: societyId },
        select: { name: true, currency: true, timeZone: true },
      }),
      p.resident.count({ where: { societyId } }),
      p.resident.count({ where: { societyId, status: 'ACTIVE' } }),
      p.unit.count({ where: { property: { societyId }, status: 'OCCUPIED' } }),
      p.unit.count({ where: { property: { societyId }, status: 'AVAILABLE' } }),
      p.payment.aggregate({
        where: {
          societyId,
          status: 'CONFIRMED',
          paymentDate: { gte: window.start, lte: window.end },
        },
        _sum: { amount: true },
      }),
      p.monthlyDue.aggregate({
        where: {
          resident: { societyId },
          status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        _sum: { totalAmount: true, paidAmount: true, waivedAmount: true },
      }),
      p.monthlyDue.count({
        where: { resident: { societyId }, status: 'OVERDUE' },
      }),
      p.complaint.count({
        where: { societyId, status: { notIn: ['CLOSED', 'REJECTED'] } },
      }),
      p.complaint.count({
        where: {
          societyId,
          targetResolutionAt: { lt: now },
          resolvedAt: null,
        },
      }),
      p.maintenanceRequest.count({
        where: {
          societyId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
        },
      }),
      p.serviceWorker.count({ where: { societyId, status: 'AVAILABLE' } }),
      p.serviceWorker.count({ where: { societyId, status: 'BUSY' } }),
      p.salaryRecord.aggregate({
        where: {
          staff: { societyId },
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        },
        _sum: { netPayable: true, amountPaid: true },
      }),
      p.notificationRecipient.count({
        where: { notification: { societyId }, readStatus: 'UNREAD' },
      }),
      p.notificationDelivery.count({
        where: { recipient: { notification: { societyId } }, status: 'FAILED' },
      }),
      canFinance
        ? p.$queryRaw(
            Prisma.sql`
              SELECT date_trunc('month', "payment_date") AS "month",
                     COALESCE(SUM("amount"), 0)::text AS "value"
              FROM "payment"
              WHERE "society_id" = ${societyId}::uuid
                AND "status" = 'CONFIRMED'
                AND "payment_date" >= ${window.start.toISOString()}::timestamptz
                AND "payment_date" <= ${window.end.toISOString()}::timestamptz
              GROUP BY 1
              ORDER BY 1
            `,
          )
        : [],
      canFinance
        ? p.$queryRaw(
            Prisma.sql`
              SELECT date_trunc('month', "due_date") AS "month",
                     COALESCE(SUM("total_amount"), 0)::text AS "due",
                     COALESCE(SUM("paid_amount"), 0)::text AS "paid",
                     COALESCE(SUM("waived_amount"), 0)::text AS "waived"
              FROM "monthly_due"
              WHERE "society_id" = ${societyId}::uuid
                AND "due_date" >= ${window.start.toISOString()}::date
                AND "due_date" <= ${window.end.toISOString()}::date
              GROUP BY 1
              ORDER BY 1
            `,
          )
        : [],
      canTickets
        ? p.complaint.groupBy({
            by: ['status'],
            where: {
              societyId,
              createdAt: { gte: window.start, lte: window.end },
            },
            _count: { _all: true },
          })
        : [],
      p.serviceWorker.groupBy({
        by: ['status'],
        where: { societyId, archivedAt: null },
        _count: { _all: true },
      }),
      canNotifications
        ? p.notificationDelivery.groupBy({
            by: ['channel', 'status'],
            where: {
              recipient: { notification: { societyId } },
              createdAt: { gte: window.start, lte: window.end },
            },
            _count: { _all: true },
          })
        : [],
    ]);
    const dueTotals = (dueRows as any[]).reduce(
      (totals, row) => ({
        due: totals.due + Number(row.due ?? 0),
        paid: totals.paid + Number(row.paid ?? 0),
        waived: totals.waived + Number(row.waived ?? 0),
      }),
      { due: 0, paid: 0, waived: 0 },
    );
    return {
      context: {
        societyName: society?.name ?? 'Residence.io',
        currency: society?.currency ?? 'PKR',
        timeZone: society?.timeZone ?? 'UTC',
        period,
        from: window.start,
        to: window.end,
      },
      totalResidents,
      activeResidents,
      occupiedUnits,
      vacantUnits,
      paymentsReceived: canFinance
        ? (received._sum.amount?.toString() ?? '0.00')
        : null,
      outstandingDues: canFinance
        ? this.balance(
            outstanding._sum.totalAmount,
            outstanding._sum.paidAmount,
            outstanding._sum.waivedAmount,
          )
        : null,
      overdueDues: canFinance ? overdueDues : null,
      openComplaints: canTickets ? openComplaints : null,
      overdueComplaints: canTickets ? overdueComplaints : null,
      pendingMaintenance: canTickets ? pendingMaintenance : null,
      availableWorkers,
      assignedWorkers,
      pendingSalary: canSalary
        ? this.balance(
            pendingSalary._sum.netPayable,
            pendingSalary._sum.amountPaid,
          )
        : null,
      unreadNotifications: canNotifications ? unreadNotifications : null,
      failedDeliveries: canNotifications ? failedDeliveries : null,
      charts: {
        paymentTrend: monthlySeries(window.labels, paymentRows as any[]),
        duesBreakdown: canFinance
          ? [
              { label: 'Paid', value: dueTotals.paid },
              {
                label: 'Outstanding',
                value: Math.max(
                  0,
                  dueTotals.due - dueTotals.paid - dueTotals.waived,
                ),
              },
              { label: 'Waived', value: dueTotals.waived },
            ]
          : [],
        complaintStatus: (complaintStatus as any[]).map((item) => ({
          label: String(item.status).replaceAll('_', ' '),
          value: item._count._all,
        })),
        occupancy: [
          { label: 'Occupied', value: occupiedUnits },
          { label: 'Vacant', value: vacantUnits },
        ],
        workerStatus: (workerStatus as any[]).map((item) => ({
          label: String(item.status).replaceAll('_', ' '),
          value: item._count._all,
        })),
        notificationDelivery: (notificationDelivery as any[]).map((item) => ({
          channel: item.channel,
          status: item.status,
          value: item._count._all,
        })),
      },
    };
  }

  async residentDashboard(actor: RequestUser, query: DashboardPeriodDto) {
    const p = this.prisma as any;
    const period = query.period as DashboardPeriod;
    const now = new Date();
    const window = dashboardWindow(period, now);
    const resident = await p.resident.findFirst({
      where: { societyId: actor.societyId, userId: actor.id },
      select: { id: true, fullName: true },
    });
    if (!resident) throw new NotFoundException('Resident profile not found.');
    const [
      society,
      paid,
      outstanding,
      currentDue,
      credit,
      receipt,
      complaints,
      maintenance,
      unread,
      paymentRows,
      dueRows,
      complaintStatus,
      maintenanceStatus,
    ] = await Promise.all([
      p.society.findUnique({
        where: { id: actor.societyId },
        select: { name: true, currency: true, timeZone: true },
      }),
      p.payment.aggregate({
        where: {
          residentId: resident.id,
          status: 'CONFIRMED',
          paymentDate: { gte: window.start, lte: window.end },
        },
        _sum: { amount: true },
      }),
      p.monthlyDue.aggregate({
        where: {
          residentId: resident.id,
          status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        _sum: { totalAmount: true, paidAmount: true, waivedAmount: true },
      }),
      p.monthlyDue.findFirst({
        where: {
          residentId: resident.id,
          status: { in: ['UPCOMING', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        select: {
          totalAmount: true,
          paidAmount: true,
          waivedAmount: true,
          dueDate: true,
        },
        orderBy: { dueDate: 'asc' },
      }),
      p.residentCreditBalance.findUnique({
        where: { residentId: resident.id },
        select: { amount: true },
      }),
      p.receipt.findFirst({
        where: { payment: { residentId: resident.id } },
        select: { id: true, receiptNumber: true, issuedAt: true },
        orderBy: { issuedAt: 'desc' },
      }),
      p.complaint.count({
        where: {
          residentId: resident.id,
          status: { notIn: ['CLOSED', 'REJECTED'] },
        },
      }),
      p.maintenanceRequest.count({
        where: {
          residentId: resident.id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      p.notificationRecipient.count({
        where: { userId: actor.id, readStatus: 'UNREAD' },
      }),
      p.$queryRaw(
        Prisma.sql`
          SELECT date_trunc('month', "payment_date") AS "month",
                 COALESCE(SUM("amount"), 0)::text AS "value"
          FROM "payment"
          WHERE "resident_id" = ${resident.id}::uuid
            AND "status" = 'CONFIRMED'
            AND "payment_date" >= ${window.start.toISOString()}::timestamptz
            AND "payment_date" <= ${window.end.toISOString()}::timestamptz
          GROUP BY 1
          ORDER BY 1
        `,
      ),
      p.$queryRaw(
        Prisma.sql`
          SELECT date_trunc('month', "due_date") AS "month",
                 COALESCE(SUM("total_amount"), 0)::text AS "due",
                 COALESCE(SUM("paid_amount"), 0)::text AS "paid"
          FROM "monthly_due"
          WHERE "resident_id" = ${resident.id}::uuid
            AND "due_date" >= ${window.start.toISOString()}::date
            AND "due_date" <= ${window.end.toISOString()}::date
          GROUP BY 1
          ORDER BY 1
        `,
      ),
      p.complaint.groupBy({
        by: ['status'],
        where: { residentId: resident.id },
        _count: { _all: true },
      }),
      p.maintenanceRequest.groupBy({
        by: ['status'],
        where: { residentId: resident.id },
        _count: { _all: true },
      }),
    ]);
    const dueByMonth = new Map(
      (dueRows as any[]).map((row) => [
        new Date(row.month).toISOString().slice(0, 7),
        { due: Number(row.due ?? 0), paid: Number(row.paid ?? 0) },
      ]),
    );
    return {
      context: {
        societyName: society?.name ?? 'Residence.io',
        residentName: resident.fullName,
        currency: society?.currency ?? 'PKR',
        timeZone: society?.timeZone ?? 'UTC',
        period,
        from: window.start,
        to: window.end,
      },
      totalPaid: paid._sum.amount?.toString() ?? '0.00',
      outstandingBalance: this.balance(
        outstanding._sum.totalAmount,
        outstanding._sum.paidAmount,
        outstanding._sum.waivedAmount,
      ),
      currentDue: currentDue
        ? {
            ...currentDue,
            outstandingAmount: this.balance(
              currentDue.totalAmount,
              currentDue.paidAmount,
              currentDue.waivedAmount,
            ),
          }
        : null,
      advanceCredit: credit?.amount?.toString() ?? '0.00',
      latestReceipt: receipt,
      openComplaints: complaints,
      openMaintenance: maintenance,
      unreadNotifications: unread,
      charts: {
        paymentTrend: monthlySeries(window.labels, paymentRows as any[]),
        duesVsPayments: window.labels.map(({ key, label }) => ({
          key,
          label,
          due: dueByMonth.get(key)?.due ?? 0,
          paid: dueByMonth.get(key)?.paid ?? 0,
        })),
        financialBreakdown: [
          {
            label: 'Paid in period',
            value: Number(paid._sum.amount?.toString() ?? 0),
          },
          {
            label: 'Outstanding',
            value: Number(
              this.balance(
                outstanding._sum.totalAmount,
                outstanding._sum.paidAmount,
                outstanding._sum.waivedAmount,
              ),
            ),
          },
        ],
        complaintStatus: (complaintStatus as any[]).map((item) => ({
          label: String(item.status).replaceAll('_', ' '),
          value: item._count._all,
        })),
        maintenanceStatus: (maintenanceStatus as any[]).map((item) => ({
          label: String(item.status).replaceAll('_', ' '),
          value: item._count._all,
        })),
      },
    };
  }

  private flatten(
    value: any,
    prefix = '',
    output: Record<string, string> = {},
  ) {
    for (const [key, entry] of Object.entries(value ?? {})) {
      const name = prefix ? `${prefix}.${key}` : key;
      if (
        entry &&
        typeof entry === 'object' &&
        !(entry instanceof Date) &&
        !Array.isArray(entry)
      )
        this.flatten(entry, name, output);
      else
        output[name] = Array.isArray(entry)
          ? JSON.stringify(entry)
          : entry instanceof Date
            ? entry.toISOString()
            : String(entry ?? '');
    }
    return output;
  }

  private balance(total: unknown, paid: unknown, waived: unknown = 0) {
    return (
      Number(total ?? 0) -
      Number(paid ?? 0) -
      Number(waived ?? 0)
    ).toFixed(2);
  }

  private assertReportAccess(actor: RequestUser, code: string) {
    if (!this.hasReportAccess(actor, code))
      throw new ForbiddenException('You do not have access to this report.');
  }

  private hasReportAccess(actor: RequestUser, code: string) {
    const finance = [
      'dues',
      'aging',
      'payments',
      'payment-methods',
      'adjustments',
      'receipts',
      'credits',
    ];
    const workforce = ['workforce', 'salaries', 'worker-workload'];
    const tickets = ['complaints', 'maintenance', 'sla'];
    const notifications = ['notification-delivery', 'notification-failures'];
    let allowed = false;
    if (['resident-directory', 'resident-status', 'occupancy'].includes(code))
      allowed = actor.permissions.includes('RESIDENT_READ');
    else if (finance.includes(code))
      allowed = actor.permissions.includes('BILLING_DUE_READ');
    else if (workforce.includes(code))
      allowed = actor.permissions.some((permission) =>
        ['STAFF_MANAGE', 'WORKER_MANAGE', 'SALARY_READ'].includes(permission),
      );
    else if (tickets.includes(code))
      allowed = actor.permissions.some((permission) =>
        ['COMPLAINT_READ', 'MAINTENANCE_READ'].includes(permission),
      );
    else if (notifications.includes(code))
      allowed = actor.permissions.includes('NOTIFICATION_LOG_READ');
    else if (code === 'audit')
      allowed = actor.permissions.includes('AUDIT_READ');
    return allowed;
  }
}
