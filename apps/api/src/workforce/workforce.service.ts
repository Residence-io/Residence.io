/* eslint-disable @typescript-eslint/no-base-to-string */
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
import { IdentityProtectionService } from '../residents/identity-protection.service';
import {
  AvailabilityDto,
  ContractorCompanyDto,
  DepartmentDto,
  EligibilityDto,
  JobTitleDto,
  LifecycleDto,
  OverrideDto,
  PerformanceDto,
  ReservationDto,
  SalaryAdjustmentDto,
  SalaryPaymentDto,
  SalaryPeriodDto,
  SalaryReversalDto,
  SalaryStructureDto,
  StaffDto,
  WorkerCategoryDto,
  WorkerDto,
  WorkerSkillDto,
  WorkforceQueryDto,
} from './dto/workforce.dto';
import {
  localScheduleParts,
  salaryNet,
  workforceMoney,
} from './workforce-calculator';
import { WorkforceIdService } from './workforce-id.service';

@Injectable()
export class WorkforceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ids: WorkforceIdService,
    private readonly identity: IdentityProtectionService,
    private readonly storage: PrivateStorageService,
  ) {}

  async createDepartment(actor: RequestUser, dto: DepartmentDto) {
    const item = await this.prisma.department.create({
      data: {
        societyId: actor.societyId,
        name: dto.name.trim(),
        normalizedName: dto.name.trim().toUpperCase(),
        description: dto.description?.trim(),
        displayOrder: dto.displayOrder,
        active: dto.active,
      },
    });
    await this.audit(actor, 'DEPARTMENT_CREATED', 'Department', item.id);
    return item;
  }

  listDepartments(actor: RequestUser) {
    return this.prisma.department.findMany({
      where: { societyId: actor.societyId },
      include: {
        jobTitles: { orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createJobTitle(actor: RequestUser, dto: JobTitleDto) {
    const department = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, societyId: actor.societyId, active: true },
    });
    if (!department)
      throw new NotFoundException('Active department not found.');
    const item = await this.prisma.jobTitle.create({
      data: {
        societyId: actor.societyId,
        departmentId: department.id,
        name: dto.name.trim(),
        normalizedName: dto.name.trim().toUpperCase(),
        description: dto.description?.trim(),
        displayOrder: dto.displayOrder,
        active: dto.active,
      },
    });
    await this.audit(actor, 'JOB_TITLE_CREATED', 'JobTitle', item.id);
    return item;
  }

  async setSetupActive(
    actor: RequestUser,
    kind: 'department' | 'jobTitle' | 'workerCategory' | 'workerSkill',
    id: string,
    active: boolean,
  ) {
    const permission =
      kind === 'workerCategory' || kind === 'workerSkill'
        ? 'WORKER_MANAGE'
        : 'STAFF_MANAGE';
    if (!actor.permissions.includes(permission))
      throw new ForbiddenException(
        'Workforce configuration access is not permitted.',
      );
    const delegate = (this.prisma as any)[kind];
    const result = await delegate.updateMany({
      where: { id, societyId: actor.societyId },
      data: {
        active,
        ...(kind === 'workerSkill' ? {} : { version: { increment: 1 } }),
      },
    });
    if (!result.count)
      throw new NotFoundException('Configuration item not found.');
    await this.audit(actor, 'WORKFORCE_CONFIGURATION_CHANGED', kind, id, {
      active,
    });
  }

  async registerStaff(actor: RequestUser, dto: StaffDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const title = await tx.jobTitle.findFirst({
          where: {
            id: dto.jobTitleId,
            departmentId: dto.departmentId,
            societyId: actor.societyId,
            active: true,
            department: { active: true },
          },
        });
        if (!title)
          throw new BadRequestException(
            'Department and job title do not match.',
          );
        if (
          dto.probationEndDate &&
          new Date(dto.probationEndDate) < new Date(dto.joiningDate)
        )
          throw new BadRequestException(
            'Probation end cannot precede joining date.',
          );
        const protectedIdentity = dto.identityNumber
          ? this.identity.protect(dto.identityNumber)
          : undefined;
        const staffNumber = await this.ids.nextStaff(tx, actor.societyId);
        const staff = await tx.staffMember.create({
          data: {
            societyId: actor.societyId,
            staffNumber,
            fullName: dto.fullName.trim(),
            normalizedFullName: dto.fullName.trim().toLowerCase(),
            guardianName: dto.guardianName?.trim(),
            identityCiphertext: protectedIdentity?.ciphertext,
            identitySearchHash: protectedIdentity?.searchHash,
            identityLastFour: protectedIdentity?.lastFour,
            dateOfBirth: dto.dateOfBirth
              ? new Date(dto.dateOfBirth)
              : undefined,
            gender: dto.gender as any,
            email: dto.email?.toLowerCase(),
            primaryPhone: dto.primaryPhone,
            alternatePhone: dto.alternatePhone,
            address: dto.address,
            emergencyContactName: dto.emergencyContactName,
            emergencyContactPhone: dto.emergencyContactPhone,
            status: dto.probationEndDate ? 'PROBATION' : 'ACTIVE',
            employments: {
              create: {
                departmentId: dto.departmentId,
                jobTitleId: dto.jobTitleId,
                supervisorStaffId: dto.supervisorStaffId,
                employmentType: dto.employmentType as any,
                joiningDate: new Date(dto.joiningDate),
                probationEndDate: dto.probationEndDate
                  ? new Date(dto.probationEndDate)
                  : undefined,
                effectiveFrom: new Date(dto.joiningDate),
                workShift: dto.workShift,
                paymentMethod: dto.paymentMethod as any,
                notes: dto.notes,
              },
            },
            statusHistory: {
              create: {
                toStatus: dto.probationEndDate ? 'PROBATION' : 'ACTIVE',
                reason: 'Initial staff registration',
                effectiveAt: new Date(dto.joiningDate),
                actedByUserId: actor.id,
              },
            },
          },
        });
        await this.txAudit(
          tx,
          actor,
          'STAFF_CREATED',
          'StaffMember',
          staff.id,
          {
            staffNumber,
          },
        );
        await this.outbox(tx, 'StaffMember', staff.id, 'STAFF_CREATED', {
          societyId: actor.societyId,
          staffId: staff.id,
        });
        return this.safeStaff(staff);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async listStaff(actor: RequestUser, query: WorkforceQueryDto) {
    const where: Prisma.StaffMemberWhereInput = {
      societyId: actor.societyId,
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.departmentId
        ? {
            employments: {
              some: { departmentId: query.departmentId, effectiveTo: null },
            },
          }
        : {}),
      ...(query.jobTitleId
        ? {
            employments: {
              some: { jobTitleId: query.jobTitleId, effectiveTo: null },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { staffNumber: { contains: query.search, mode: 'insensitive' } },
              { normalizedFullName: { contains: query.search.toLowerCase() } },
              { primaryPhone: { contains: query.search } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.staffMember.findMany({
        where,
        include: {
          employments: {
            where: { effectiveTo: null },
            take: 1,
            include: { department: true, jobTitle: true },
          },
        },
        orderBy: [{ staffNumber: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.staffMember.count({ where }),
    ]);
    return {
      items: items.map((item) => this.safeStaff(item)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async staff(actor: RequestUser, id: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { id, societyId: actor.societyId },
      include: {
        employments: { include: { department: true, jobTitle: true } },
        salaryStructures: { orderBy: { effectiveFrom: 'desc' } },
        salaryRecords: {
          include: { salaryPeriod: true, payments: true, slips: true },
          orderBy: { generatedAt: 'desc' },
        },
        documents: { where: { status: 'ACTIVE' } },
        statusHistory: { orderBy: { effectiveAt: 'desc' } },
      },
    });
    if (!staff) throw new NotFoundException('Staff member not found.');
    return this.safeStaff(staff);
  }

  async transitionStaff(
    actor: RequestUser,
    id: string,
    status: string,
    dto: LifecycleDto,
  ) {
    const allowed = [
      'ACTIVE',
      'ON_LEAVE',
      'SUSPENDED',
      'RESIGNED',
      'TERMINATED',
      'RETIRED',
      'ARCHIVED',
    ];
    if (!allowed.includes(status))
      throw new BadRequestException('Invalid staff status.');
    const current = await this.prisma.staffMember.findFirst({
      where: { id, societyId: actor.societyId },
    });
    if (!current) throw new NotFoundException('Staff member not found.');
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.staffMember.updateMany({
        where: { id, societyId: actor.societyId, version: dto.version },
        data: {
          status: status as any,
          archivedAt:
            status === 'ARCHIVED' ? new Date(dto.effectiveAt) : undefined,
          version: { increment: 1 },
        },
      });
      if (!updated.count)
        throw new ConflictException('Staff record changed; reload and retry.');
      await tx.staffStatusHistory.create({
        data: {
          staffId: id,
          fromStatus: current.status,
          toStatus: status as any,
          reason: dto.reason,
          effectiveAt: new Date(dto.effectiveAt),
          actedByUserId: actor.id,
        },
      });
      await this.txAudit(
        tx,
        actor,
        'STAFF_STATUS_CHANGED',
        'StaffMember',
        id,
        { status },
        dto.reason,
      );
      await this.outbox(tx, 'StaffMember', id, 'STAFF_STATUS_CHANGED', {
        status,
      });
      return tx.staffMember.findUniqueOrThrow({ where: { id } });
    });
    return this.safeStaff(result);
  }

  async createSalaryStructure(actor: RequestUser, dto: SalaryStructureDto) {
    const from = new Date(dto.effectiveFrom);
    const to = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (to && to < from)
      throw new BadRequestException('Salary end cannot precede start.');
    const staff = await this.prisma.staffMember.findFirst({
      where: { id: dto.staffId, societyId: actor.societyId },
    });
    if (!staff) throw new NotFoundException('Staff member not found.');
    const overlap = await this.prisma.salaryStructure.findFirst({
      where: {
        staffId: dto.staffId,
        effectiveFrom: { lte: to ?? new Date('9999-12-31') },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: from } }],
      },
    });
    if (overlap)
      throw new ConflictException('An overlapping salary structure exists.');
    const basic = workforceMoney(dto.basicSalary);
    const allowances = workforceMoney(dto.fixedAllowances);
    const deductions = workforceMoney(dto.fixedDeductions);
    if (salaryNet(basic, allowances, deductions).lt(0))
      throw new BadRequestException('Deductions exceed salary and allowances.');
    const structure = await this.prisma.salaryStructure.create({
      data: {
        staffId: staff.id,
        basicSalary: basic,
        fixedAllowances: allowances,
        fixedDeductions: deductions,
        frequency: dto.frequency as any,
        currency: dto.currency,
        effectiveFrom: from,
        effectiveTo: to,
        notes: dto.notes,
        createdByUserId: actor.id,
      },
    });
    await this.audit(
      actor,
      'SALARY_STRUCTURE_CREATED',
      'SalaryStructure',
      structure.id,
    );
    return structure;
  }

  async previewSalaries(actor: RequestUser, dto: SalaryPeriodDto) {
    const range = this.period(dto);
    const staff = await this.salaryEligible(
      actor.societyId,
      range.start,
      range.end,
    );
    return {
      period: dto,
      eligible: staff.filter((item: any) => item.salaryStructures.length)
        .length,
      skipped: staff.filter((item: any) => !item.salaryStructures.length)
        .length,
      items: staff.map((item: any) => ({
        staffId: item.id,
        staffNumber: item.staffNumber,
        fullName: item.fullName,
        net: item.salaryStructures[0]
          ? salaryNet(
              item.salaryStructures[0].basicSalary,
              item.salaryStructures[0].fixedAllowances,
              item.salaryStructures[0].fixedDeductions,
            ).toFixed(2)
          : null,
      })),
    };
  }

  async generateSalaries(actor: RequestUser, dto: SalaryPeriodDto) {
    const range = this.period(dto);
    return this.prisma.$transaction(
      async (tx) => {
        const period = await tx.salaryPeriod.upsert({
          where: {
            uk_salary_period_society_month: {
              societyId: actor.societyId,
              year: dto.year,
              month: dto.month,
            },
          },
          create: {
            societyId: actor.societyId,
            year: dto.year,
            month: dto.month,
            startsAt: range.start,
            endsAt: range.end,
          },
          update: {},
        });
        const staff = await this.salaryEligible(
          actor.societyId,
          range.start,
          range.end,
          tx,
        );
        let generated = 0;
        let skipped = 0;
        for (const member of staff) {
          const structure = member.salaryStructures[0];
          if (!structure) {
            skipped++;
            continue;
          }
          const existing = await tx.salaryRecord.findUnique({
            where: {
              uk_salary_record_staff_period: {
                staffId: member.id,
                salaryPeriodId: period.id,
              },
            },
          });
          if (existing) {
            skipped++;
            continue;
          }
          const net = salaryNet(
            structure.basicSalary,
            structure.fixedAllowances,
            structure.fixedDeductions,
          );
          const record = await tx.salaryRecord.create({
            data: {
              staffId: member.id,
              salaryPeriodId: period.id,
              salaryStructureId: structure.id,
              basicSalary: structure.basicSalary,
              allowances: structure.fixedAllowances,
              deductions: structure.fixedDeductions,
              netPayable: net,
              currency: structure.currency,
              status: 'PENDING',
              salarySnapshot: {
                structureId: structure.id,
                basicSalary: structure.basicSalary.toFixed(2),
                allowances: structure.fixedAllowances.toFixed(2),
                deductions: structure.fixedDeductions.toFixed(2),
                frequency: structure.frequency,
                effectiveFrom: structure.effectiveFrom.toISOString(),
              },
              generatedByUserId: actor.id,
            },
          });
          await this.outbox(
            tx,
            'SalaryRecord',
            record.id,
            'SALARY_RECORD_GENERATED',
            {
              staffId: member.id,
              period: `${dto.year}-${String(dto.month).padStart(2, '0')}`,
            },
          );
          generated++;
        }
        await this.txAudit(
          tx,
          actor,
          'SALARIES_GENERATED',
          'SalaryPeriod',
          period.id,
          {
            generated,
            skipped,
          },
        );
        return { period, generated, skipped };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 60_000,
      },
    );
  }

  listSalaryRecords(actor: RequestUser, query: WorkforceQueryDto) {
    return this.prisma.salaryRecord.findMany({
      where: {
        staff: { societyId: actor.societyId },
        ...(query.status ? { status: query.status as any } : {}),
      },
      include: {
        staff: {
          select: {
            id: true,
            staffNumber: true,
            fullName: true,
            primaryPhone: true,
            email: true,
            status: true,
            version: true,
          },
        },
        salaryPeriod: true,
        payments: true,
        slips: true,
      },
      orderBy: [
        { salaryPeriod: { year: 'desc' } },
        { salaryPeriod: { month: 'desc' } },
      ],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
  }

  async recordSalaryPayment(
    actor: RequestUser,
    recordId: string,
    dto: SalaryPaymentDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "salary_record" WHERE "id"=${recordId}::uuid FOR UPDATE`;
        const record = await tx.salaryRecord.findFirst({
          where: { id: recordId, staff: { societyId: actor.societyId } },
        });
        if (!record || ['CANCELLED', 'REVERSED'].includes(record.status))
          throw new NotFoundException('Payable salary record not found.');
        const amount = workforceMoney(dto.amount);
        if (
          amount.lte(0) ||
          record.amountPaid.add(amount).gt(record.netPayable)
        )
          throw new BadRequestException(
            'Salary payment exceeds the remaining amount.',
          );
        if (dto.currency !== record.currency)
          throw new BadRequestException(
            `Salary payment must use ${record.currency}.`,
          );
        const paid = workforceMoney(record.amountPaid.add(amount));
        const payment = await tx.salaryPayment.create({
          data: {
            salaryRecordId: record.id,
            amount,
            currency: dto.currency,
            method: dto.method as any,
            paymentDate: dto.paymentDate
              ? new Date(dto.paymentDate)
              : new Date(),
            transactionReference: dto.transactionReference,
            notes: dto.notes,
            recordedByUserId: actor.id,
            idempotencyKey: dto.idempotencyKey,
          },
        });
        await tx.salaryRecord.update({
          where: { id: record.id },
          data: {
            amountPaid: paid,
            status: paid.eq(record.netPayable) ? 'PAID' : 'PARTIALLY_PAID',
            paidAt: paid.eq(record.netPayable) ? new Date() : null,
            version: { increment: 1 },
          },
        });
        await this.txAudit(
          tx,
          actor,
          'SALARY_PAYMENT_RECORDED',
          'SalaryPayment',
          payment.id,
          {
            currency: payment.currency,
            method: payment.method,
          },
        );
        await this.outbox(
          tx,
          'SalaryPayment',
          payment.id,
          'SALARY_PAYMENT_RECORDED',
          {
            salaryRecordId: record.id,
          },
        );
        return payment;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async adjustSalary(
    actor: RequestUser,
    recordId: string,
    dto: SalaryAdjustmentDto,
  ) {
    const record = await this.prisma.salaryRecord.findFirst({
      where: { id: recordId, staff: { societyId: actor.societyId } },
    });
    if (!record || ['PAID', 'CANCELLED', 'REVERSED'].includes(record.status))
      throw new ConflictException(
        'Completed salary records cannot be adjusted.',
      );
    const amount = workforceMoney(dto.amount);
    const positive = ['ALLOWANCE', 'CREDIT_CORRECTION'].includes(dto.type);
    const delta = positive ? amount : amount.negated();
    const net = workforceMoney(record.netPayable.add(delta));
    if (net.lt(record.amountPaid) || net.lt(0))
      throw new BadRequestException(
        'Adjustment would invalidate the salary balance.',
      );
    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.salaryAdjustment.create({
        data: {
          salaryRecordId: record.id,
          type: dto.type as any,
          amount,
          reason: dto.reason,
          actedByUserId: actor.id,
          idempotencyKey: dto.idempotencyKey,
        },
      });
      await tx.salaryRecord.update({
        where: { id: record.id },
        data: {
          adjustmentTotal: { increment: delta },
          netPayable: net,
          version: { increment: 1 },
        },
      });
      await this.txAudit(
        tx,
        actor,
        'SALARY_ADJUSTED',
        'SalaryAdjustment',
        adjustment.id,
        {},
        dto.reason,
      );
      return adjustment;
    });
  }

  async reverseSalaryPayment(
    actor: RequestUser,
    paymentId: string,
    dto: SalaryReversalDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const payment = await tx.salaryPayment.findFirst({
          where: {
            id: paymentId,
            salaryRecord: { staff: { societyId: actor.societyId } },
          },
          include: { salaryRecord: true },
        });
        if (!payment) throw new NotFoundException('Salary payment not found.');
        const amount = workforceMoney(dto.amount);
        if (
          amount.lte(0) ||
          payment.reversedAmount.add(amount).gt(payment.amount)
        )
          throw new BadRequestException(
            'Reversal exceeds the remaining payment amount.',
          );
        const reversed = workforceMoney(payment.reversedAmount.add(amount));
        const paid = workforceMoney(
          payment.salaryRecord.amountPaid.sub(amount),
        );
        await tx.salaryPayment.update({
          where: { id: payment.id },
          data: {
            reversedAmount: reversed,
            status: reversed.eq(payment.amount)
              ? 'REVERSED'
              : 'PARTIALLY_REVERSED',
          },
        });
        await tx.salaryRecord.update({
          where: { id: payment.salaryRecordId },
          data: {
            amountPaid: paid,
            status: paid.eq(0) ? 'PENDING' : 'PARTIALLY_PAID',
            paidAt: null,
            version: { increment: 1 },
          },
        });
        await tx.salaryAdjustment.create({
          data: {
            salaryRecordId: payment.salaryRecordId,
            type: 'DEBIT_CORRECTION',
            amount,
            reason: dto.reason,
            actedByUserId: actor.id,
            idempotencyKey: dto.idempotencyKey,
          },
        });
        await tx.salarySlip.updateMany({
          where: { salaryRecordId: payment.salaryRecordId, status: 'ACTIVE' },
          data: { status: 'REVERSED', reversedAt: new Date() },
        });
        await this.txAudit(
          tx,
          actor,
          'SALARY_PAYMENT_REVERSED',
          'SalaryPayment',
          payment.id,
          {},
          dto.reason,
        );
        return { paymentId, reversedAmount: reversed.toFixed(2) };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async createWorkerCategory(actor: RequestUser, dto: WorkerCategoryDto) {
    const item = await this.prisma.workerCategory.create({
      data: {
        societyId: actor.societyId,
        code: dto.code,
        name: dto.name.trim(),
        description: dto.description,
        defaultDurationMinutes: dto.defaultDurationMinutes,
        defaultRate: dto.defaultRate
          ? workforceMoney(dto.defaultRate)
          : undefined,
        currency: dto.currency,
      },
    });
    await this.audit(
      actor,
      'WORKER_CATEGORY_CREATED',
      'WorkerCategory',
      item.id,
    );
    return item;
  }

  listWorkerSetup(actor: RequestUser) {
    return Promise.all([
      this.prisma.workerCategory.findMany({
        where: { societyId: actor.societyId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.workerSkill.findMany({
        where: { societyId: actor.societyId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.contractorCompany.findMany({
        where: { societyId: actor.societyId },
        orderBy: { name: 'asc' },
      }),
    ]).then(([categories, skills, contractorCompanies]) => ({
      categories,
      skills,
      contractorCompanies,
    }));
  }

  async createContractorCompany(actor: RequestUser, dto: ContractorCompanyDto) {
    const item = await this.prisma.contractorCompany.create({
      data: {
        societyId: actor.societyId,
        name: dto.name.trim(),
        normalizedName: dto.name.trim().toUpperCase(),
        contactName: dto.contactName?.trim(),
        phone: dto.phone,
        email: dto.email?.toLowerCase(),
        address: dto.address?.trim(),
      },
    });
    await this.audit(
      actor,
      'CONTRACTOR_COMPANY_CREATED',
      'ContractorCompany',
      item.id,
    );
    return item;
  }

  async createWorkerSkill(actor: RequestUser, dto: WorkerSkillDto) {
    const item = await this.prisma.workerSkill.create({
      data: {
        societyId: actor.societyId,
        name: dto.name.trim(),
        normalizedName: dto.name.trim().toUpperCase(),
        description: dto.description,
      },
    });
    await this.audit(actor, 'WORKER_SKILL_CREATED', 'WorkerSkill', item.id);
    return item;
  }

  async registerWorker(actor: RequestUser, dto: WorkerDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const category = await tx.workerCategory.findFirst({
          where: {
            id: dto.primaryCategoryId,
            societyId: actor.societyId,
            active: true,
          },
        });
        if (!category)
          throw new NotFoundException('Active worker category not found.');
        const skillCount = await tx.workerSkill.count({
          where: {
            id: { in: dto.skillIds },
            societyId: actor.societyId,
            active: true,
          },
        });
        if (skillCount !== new Set(dto.skillIds).size)
          throw new BadRequestException(
            'One or more worker skills are invalid.',
          );
        if (
          dto.relationship === 'EXTERNAL_CONTRACTOR' &&
          !dto.contractorCompanyId
        )
          throw new BadRequestException('Contractor company is required.');
        if (dto.contractorCompanyId) {
          const company = await tx.contractorCompany.findFirst({
            where: {
              id: dto.contractorCompanyId,
              societyId: actor.societyId,
              active: true,
            },
          });
          if (!company)
            throw new BadRequestException(
              'Active contractor company not found.',
            );
        }
        const identity = dto.identityNumber
          ? this.identity.protect(dto.identityNumber)
          : undefined;
        const workerNumber = await this.ids.nextWorker(
          tx,
          actor.societyId,
          category.code,
        );
        const worker = await tx.serviceWorker.create({
          data: {
            societyId: actor.societyId,
            workerNumber,
            primaryCategoryId: category.id,
            contractorCompanyId: dto.contractorCompanyId,
            fullName: dto.fullName.trim(),
            normalizedFullName: dto.fullName.trim().toLowerCase(),
            identityCiphertext: identity?.ciphertext,
            identitySearchHash: identity?.searchHash,
            identityLastFour: identity?.lastFour,
            dateOfBirth: dto.dateOfBirth
              ? new Date(dto.dateOfBirth)
              : undefined,
            primaryPhone: dto.primaryPhone,
            alternatePhone: dto.alternatePhone,
            email: dto.email?.toLowerCase(),
            address: dto.address,
            emergencyContact: dto.emergencyContact,
            relationship: dto.relationship as any,
            experienceYears: dto.experienceYears,
            serviceArea: dto.serviceArea,
            rateNotes: dto.rateNotes,
            registrationDate: new Date(dto.registrationDate),
            administrativeNotes: dto.administrativeNotes,
            skills: {
              create: [...new Set(dto.skillIds)].map((skillId) => ({
                skillId,
              })),
            },
            statusHistory: {
              create: {
                toStatus: 'AVAILABLE',
                reason: 'Initial worker registration',
                effectiveAt: new Date(dto.registrationDate),
                actedByUserId: actor.id,
              },
            },
          },
        });
        await this.txAudit(
          tx,
          actor,
          'WORKER_CREATED',
          'ServiceWorker',
          worker.id,
          {
            workerNumber,
          },
        );
        return this.safeWorker(worker);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async listWorkers(actor: RequestUser, query: WorkforceQueryDto) {
    const where: Prisma.ServiceWorkerWhereInput = {
      societyId: actor.societyId,
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.categoryId ? { primaryCategoryId: query.categoryId } : {}),
      ...(query.skillId
        ? { skills: { some: { skillId: query.skillId } } }
        : {}),
      ...(query.serviceArea
        ? { serviceArea: { contains: query.serviceArea, mode: 'insensitive' } }
        : {}),
      ...(query.relationship
        ? { relationship: query.relationship as any }
        : {}),
      ...(query.search
        ? {
            OR: [
              { workerNumber: { contains: query.search, mode: 'insensitive' } },
              { normalizedFullName: { contains: query.search.toLowerCase() } },
              { primaryPhone: { contains: query.search } },
              {
                primaryCategory: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                contractorCompany: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceWorker.findMany({
        where,
        include: {
          primaryCategory: true,
          contractorCompany: true,
          skills: { include: { skill: true } },
        },
        orderBy: [{ workerNumber: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.serviceWorker.count({ where }),
    ]);
    return {
      items: items.map((item) => this.safeWorker(item)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async worker(actor: RequestUser, id: string) {
    const worker = await this.prisma.serviceWorker.findFirst({
      where: { id, societyId: actor.societyId },
      include: {
        primaryCategory: true,
        contractorCompany: true,
        skills: { include: { skill: true } },
        availability: true,
        overrides: { orderBy: { startsAt: 'desc' } },
        reservations: { orderBy: { startsAt: 'desc' } },
        rates: { orderBy: { effectiveFrom: 'desc' } },
        documents: { where: { status: 'ACTIVE' } },
        performanceNotes: { orderBy: { reviewDate: 'desc' } },
        statusHistory: { orderBy: { effectiveAt: 'desc' } },
      },
    });
    if (!worker) throw new NotFoundException('Worker not found.');
    return this.safeWorker(worker);
  }

  async transitionWorker(
    actor: RequestUser,
    id: string,
    status: string,
    dto: LifecycleDto,
  ) {
    const allowed = [
      'AVAILABLE',
      'OFF_DUTY',
      'ON_LEAVE',
      'SUSPENDED',
      'INACTIVE',
      'ARCHIVED',
    ];
    if (!allowed.includes(status))
      throw new BadRequestException('Invalid worker status.');
    const current = await this.prisma.serviceWorker.findFirst({
      where: { id, societyId: actor.societyId },
    });
    if (!current) throw new NotFoundException('Worker not found.');
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.serviceWorker.updateMany({
        where: { id, societyId: actor.societyId, version: dto.version },
        data: {
          status: status as any,
          archivedAt:
            status === 'ARCHIVED' ? new Date(dto.effectiveAt) : undefined,
          version: { increment: 1 },
        },
      });
      if (!changed.count)
        throw new ConflictException('Worker record changed; reload and retry.');
      await tx.workerStatusHistory.create({
        data: {
          workerId: id,
          fromStatus: current.status,
          toStatus: status as any,
          reason: dto.reason,
          effectiveAt: new Date(dto.effectiveAt),
          actedByUserId: actor.id,
        },
      });
      await this.txAudit(
        tx,
        actor,
        'WORKER_STATUS_CHANGED',
        'ServiceWorker',
        id,
        { status },
        dto.reason,
      );
      return tx.serviceWorker.findUniqueOrThrow({ where: { id } });
    });
  }

  async addAvailability(
    actor: RequestUser,
    workerId: string,
    dto: AvailabilityDto,
  ) {
    await this.assertWorker(actor, workerId);
    if (dto.endMinute <= dto.startMinute)
      throw new BadRequestException('Availability end must follow start.');
    const item = await this.prisma.workerAvailability.create({
      data: { workerId, ...dto },
    });
    await this.audit(
      actor,
      'WORKER_AVAILABILITY_CHANGED',
      'WorkerAvailability',
      item.id,
    );
    return item;
  }

  async addOverride(actor: RequestUser, workerId: string, dto: OverrideDto) {
    await this.assertWorker(actor, workerId);
    if (new Date(dto.endsAt) <= new Date(dto.startsAt))
      throw new BadRequestException('Override end must follow start.');
    const item = await this.prisma.workerAvailabilityOverride.create({
      data: {
        workerId,
        type: dto.type as any,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        reason: dto.reason,
        createdByUserId: actor.id,
      },
    });
    await this.audit(
      actor,
      'WORKER_AVAILABILITY_CHANGED',
      'WorkerAvailabilityOverride',
      item.id,
    );
    return item;
  }

  async reserve(actor: RequestUser, dto: ReservationDto) {
    await this.assertWorker(actor, dto.workerId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt)
      throw new BadRequestException('Reservation end must follow start.');
    const eligible = await this.findEligible(actor, {
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      serviceArea: dto.serviceArea,
    });
    if (!eligible.some((worker) => worker.id === dto.workerId))
      throw new ConflictException(
        'Worker is not eligible for this reservation window.',
      );
    try {
      const reservation = await this.prisma.workerScheduleReservation.create({
        data: {
          workerId: dto.workerId,
          startsAt,
          endsAt,
          serviceArea: dto.serviceArea,
          purpose: dto.purpose,
          createdByUserId: actor.id,
        },
      });
      await this.audit(
        actor,
        'WORKER_RESERVATION_CREATED',
        'WorkerScheduleReservation',
        reservation.id,
      );
      return reservation;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        throw new ConflictException(
          'Worker already has an overlapping reservation.',
        );
      throw error;
    }
  }

  async addPerformance(
    actor: RequestUser,
    workerId: string,
    dto: PerformanceDto,
  ) {
    await this.assertWorker(actor, workerId);
    const note = await this.prisma.workerPerformanceNote.create({
      data: {
        workerId,
        reliability: dto.reliability,
        workQuality: dto.workQuality,
        note: dto.note,
        reviewDate: new Date(dto.reviewDate),
        reviewedByUserId: actor.id,
      },
    });
    await this.audit(
      actor,
      'WORKER_PERFORMANCE_CHANGED',
      'WorkerPerformanceNote',
      note.id,
    );
    return note;
  }

  async findEligible(actor: RequestUser, dto: EligibilityDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt)
      throw new BadRequestException('Eligibility end must follow start.');
    const society = await this.prisma.society.findUniqueOrThrow({
      where: { id: actor.societyId },
      select: { timeZone: true },
    });
    const startLocal = localScheduleParts(startsAt, society.timeZone);
    const endLocal = localScheduleParts(endsAt, society.timeZone);
    if (startLocal.dayOfWeek !== endLocal.dayOfWeek) return [];
    const workers = await this.prisma.serviceWorker.findMany({
      where: {
        societyId: actor.societyId,
        status: 'AVAILABLE',
        archivedAt: null,
        ...(dto.categoryId ? { primaryCategoryId: dto.categoryId } : {}),
        ...(dto.skillId ? { skills: { some: { skillId: dto.skillId } } } : {}),
        ...(dto.serviceArea
          ? { serviceArea: { equals: dto.serviceArea, mode: 'insensitive' } }
          : {}),
        availability: {
          some: {
            dayOfWeek: startLocal.dayOfWeek,
            active: true,
            startMinute: { lte: startLocal.minute },
            endMinute: { gte: endLocal.minute },
          },
        },
        overrides: {
          none: {
            type: { in: ['UNAVAILABLE', 'LEAVE'] },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        },
        reservations: {
          none: {
            status: 'RESERVED',
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        },
      },
      include: { primaryCategory: true, skills: { include: { skill: true } } },
      orderBy: [{ workerNumber: 'asc' }, { id: 'asc' }],
    });
    return workers.map((worker) => this.safeWorker(worker));
  }

  async uploadDocument(
    actor: RequestUser,
    ownerType: 'staff' | 'worker',
    ownerId: string,
    category: string,
    file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Document is required.');
    if (!category || category.length > 80)
      throw new BadRequestException('Document category is required.');
    if (ownerType === 'staff') await this.assertStaff(actor, ownerId);
    else await this.assertWorker(actor, ownerId);
    const stored = await this.storage.store(
      ownerId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    try {
      const document =
        ownerType === 'staff'
          ? await this.prisma.staffDocument.create({
              data: {
                staffId: ownerId,
                category,
                ...stored,
                sizeBytes: BigInt(stored.sizeBytes),
                uploadedByUserId: actor.id,
              },
            })
          : await this.prisma.workerDocument.create({
              data: {
                workerId: ownerId,
                category,
                ...stored,
                sizeBytes: BigInt(stored.sizeBytes),
                uploadedByUserId: actor.id,
              },
            });
      await this.audit(
        actor,
        'WORKFORCE_DOCUMENT_UPLOADED',
        ownerType,
        document.id,
        {
          category,
        },
      );
      return {
        id: document.id,
        category,
        mediaType: stored.mediaType,
        sizeBytes: stored.sizeBytes,
      };
    } catch (error) {
      await this.storage.remove(stored.objectKey);
      throw error;
    }
  }

  async downloadDocument(
    actor: RequestUser,
    ownerType: 'staff' | 'worker',
    ownerId: string,
    documentId: string,
  ) {
    if (ownerType === 'staff') await this.assertStaff(actor, ownerId);
    else await this.assertWorker(actor, ownerId);
    const document =
      ownerType === 'staff'
        ? await this.prisma.staffDocument.findFirst({
            where: { id: documentId, staffId: ownerId, status: 'ACTIVE' },
          })
        : await this.prisma.workerDocument.findFirst({
            where: { id: documentId, workerId: ownerId, status: 'ACTIVE' },
          });
    if (!document) throw new NotFoundException('Document not found.');
    await this.audit(
      actor,
      'WORKFORCE_DOCUMENT_DOWNLOADED',
      ownerType,
      document.id,
      {
        category: document.category,
      },
    );
    return {
      buffer: await this.storage.read(document.objectKey),
      mediaType: document.mediaType,
      fileName: document.originalFileName,
    };
  }

  async dashboard(actor: RequestUser) {
    const now = new Date();
    const [totalStaff, activeStaff, available, busy, leave, salaries] =
      await Promise.all([
        this.prisma.staffMember.count({
          where: { societyId: actor.societyId },
        }),
        this.prisma.staffMember.count({
          where: { societyId: actor.societyId, status: 'ACTIVE' },
        }),
        this.prisma.serviceWorker.count({
          where: { societyId: actor.societyId, status: 'AVAILABLE' },
        }),
        this.prisma.serviceWorker.count({
          where: { societyId: actor.societyId, status: 'BUSY' },
        }),
        this.prisma.serviceWorker.count({
          where: { societyId: actor.societyId, status: 'ON_LEAVE' },
        }),
        this.prisma.salaryRecord.aggregate({
          where: {
            staff: { societyId: actor.societyId },
            salaryPeriod: {
              year: now.getUTCFullYear(),
              month: now.getUTCMonth() + 1,
            },
          },
          _sum: { amountPaid: true, netPayable: true },
        }),
      ]);
    const paid = workforceMoney(salaries._sum.amountPaid ?? 0);
    const payable = workforceMoney(salaries._sum.netPayable ?? 0);
    return {
      totalStaff,
      activeStaff,
      salaryPaid: paid.toFixed(2),
      pendingSalary: workforceMoney(payable.sub(paid)).toFixed(2),
      availableWorkers: available,
      busyWorkers: busy,
      workersOnLeave: leave,
    };
  }

  async exportCsv(actor: RequestUser, type: 'staff' | 'workers' | 'salaries') {
    const escape = (value: unknown) =>
      `"${String(value ?? '').replaceAll('"', '""')}"`;
    let csv: string;
    if (type === 'staff') {
      const rows = await this.prisma.staffMember.findMany({
        where: { societyId: actor.societyId },
        take: 10_000,
        orderBy: { staffNumber: 'asc' },
      });
      csv = [
        'Staff ID,Name,Phone,Email,Status',
        ...rows.map((row) =>
          [
            row.staffNumber,
            row.fullName,
            row.primaryPhone,
            row.email,
            row.status,
          ]
            .map(escape)
            .join(','),
        ),
      ].join('\n');
    } else if (type === 'workers') {
      const rows = await this.prisma.serviceWorker.findMany({
        where: { societyId: actor.societyId },
        include: { primaryCategory: true },
        take: 10_000,
        orderBy: { workerNumber: 'asc' },
      });
      csv = [
        'Worker ID,Name,Category,Service Area,Status',
        ...rows.map((row) =>
          [
            row.workerNumber,
            row.fullName,
            row.primaryCategory.name,
            row.serviceArea,
            row.status,
          ]
            .map(escape)
            .join(','),
        ),
      ].join('\n');
    } else {
      const rows = await this.prisma.salaryRecord.findMany({
        where: { staff: { societyId: actor.societyId } },
        include: { staff: true, salaryPeriod: true },
        take: 10_000,
        orderBy: { generatedAt: 'desc' },
      });
      csv = [
        'Staff ID,Name,Period,Net,Paid,Currency,Status',
        ...rows.map((row) =>
          [
            row.staff.staffNumber,
            row.staff.fullName,
            `${row.salaryPeriod.year}-${String(row.salaryPeriod.month).padStart(2, '0')}`,
            row.netPayable.toFixed(2),
            row.amountPaid.toFixed(2),
            row.currency,
            row.status,
          ]
            .map(escape)
            .join(','),
        ),
      ].join('\n');
    }
    await this.audit(
      actor,
      'WORKFORCE_EXPORT_GENERATED',
      'WorkforceExport',
      type,
    );
    return csv;
  }

  private salaryEligible(
    societyId: string,
    start: Date,
    end: Date,
    db: any = this.prisma,
  ) {
    return db.staffMember.findMany({
      where: {
        societyId,
        status: {
          in: [
            'ACTIVE',
            'PROBATION',
            'ON_LEAVE',
            'SUSPENDED',
            'RESIGNED',
            'TERMINATED',
          ],
        },
        employments: {
          some: {
            joiningDate: { lte: end },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
          },
        },
      },
      include: {
        salaryStructures: {
          where: {
            effectiveFrom: { lte: end },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });
  }

  private period(dto: SalaryPeriodDto) {
    return {
      start: new Date(Date.UTC(dto.year, dto.month - 1, 1)),
      end: new Date(Date.UTC(dto.year, dto.month, 0)),
    };
  }

  private async assertStaff(actor: RequestUser, id: string) {
    const item = await this.prisma.staffMember.findFirst({
      where: { id, societyId: actor.societyId },
    });
    if (!item) throw new NotFoundException('Staff member not found.');
    return item;
  }

  private async assertWorker(actor: RequestUser, id: string) {
    const item = await this.prisma.serviceWorker.findFirst({
      where: { id, societyId: actor.societyId },
    });
    if (!item) throw new NotFoundException('Worker not found.');
    return item;
  }

  private safeStaff<T extends Record<string, any>>(record: T) {
    const safe: any = { ...record };
    delete safe.identityCiphertext;
    delete safe.identitySearchHash;
    if ('identityLastFour' in safe)
      safe.maskedIdentity = safe.identityLastFour
        ? `••••${safe.identityLastFour}`
        : null;
    if (safe.employments)
      safe.employments = safe.employments.map((employment: any) => {
        const copy = { ...employment };
        delete copy.bankDetailsCiphertext;
        return copy;
      });
    return safe;
  }

  private safeWorker<T extends Record<string, any>>(record: T) {
    const safe: any = { ...record };
    delete safe.identityCiphertext;
    delete safe.identitySearchHash;
    delete safe.administrativeNotes;
    if ('identityLastFour' in safe)
      safe.maskedIdentity = safe.identityLastFour
        ? `••••${safe.identityLastFour}`
        : null;
    return safe;
  }

  private audit(
    actor: RequestUser,
    action: string,
    targetType: string,
    targetId: string,
    safeMetadata: Record<string, unknown> = {},
    reason?: string,
  ) {
    return this.prisma.auditLog.create({
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
    return tx.outboxEvent.create({
      data: {
        aggregateType,
        aggregateId,
        eventType,
        payload: payload as Prisma.InputJsonValue,
        deduplicationKey: `phase4:${eventType}:${aggregateId}`,
      },
    });
  }
}
