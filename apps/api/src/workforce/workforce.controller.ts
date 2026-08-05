import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  Public,
  RequirePermissions,
} from '../authorization/authorization.decorators';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';
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
import { SalarySlipService } from './salary-slip.service';
import { WorkforceService } from './workforce.service';

@ApiTags('workforce')
@Controller('workforce')
export class WorkforceController {
  constructor(
    private readonly workforce: WorkforceService,
    private readonly slips: SalarySlipService,
  ) {}

  @Post('departments') @RequirePermissions('STAFF_MANAGE') createDepartment(
    @CurrentUser() user: RequestUser,
    @Body() dto: DepartmentDto,
  ) {
    return this.workforce.createDepartment(user, dto);
  }
  @Get('departments') @RequirePermissions('STAFF_MANAGE') departments(
    @CurrentUser() user: RequestUser,
  ) {
    return this.workforce.listDepartments(user);
  }
  @Post('job-titles') @RequirePermissions('STAFF_MANAGE') createJobTitle(
    @CurrentUser() user: RequestUser,
    @Body() dto: JobTitleDto,
  ) {
    return this.workforce.createJobTitle(user, dto);
  }
  @Post('setup/:kind/:id/:active') setupActive(
    @CurrentUser() user: RequestUser,
    @Param('kind')
    kind: 'department' | 'jobTitle' | 'workerCategory' | 'workerSkill',
    @Param('id', ParseUUIDPipe) id: string,
    @Param('active') active: string,
  ) {
    return this.workforce.setSetupActive(user, kind, id, active === 'true');
  }

  @Post('staff') @RequirePermissions('STAFF_MANAGE') createStaff(
    @CurrentUser() user: RequestUser,
    @Body() dto: StaffDto,
  ) {
    return this.workforce.registerStaff(user, dto);
  }
  @Get('staff') @RequirePermissions('STAFF_MANAGE') staffList(
    @CurrentUser() user: RequestUser,
    @Query() query: WorkforceQueryDto,
  ) {
    return this.workforce.listStaff(user, query);
  }
  @Get('staff/:id') @RequirePermissions('STAFF_MANAGE') staff(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workforce.staff(user, id);
  }
  @Post('staff/:id/status/:status')
  @RequirePermissions('STAFF_MANAGE')
  staffStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: string,
    @Body() dto: LifecycleDto,
  ) {
    return this.workforce.transitionStaff(user, id, status, dto);
  }

  @Post('salary-structures')
  @RequirePermissions('STAFF_MANAGE')
  salaryStructure(
    @CurrentUser() user: RequestUser,
    @Body() dto: SalaryStructureDto,
  ) {
    return this.workforce.createSalaryStructure(user, dto);
  }
  @Post('salaries/preview') @RequirePermissions('SALARY_READ') salaryPreview(
    @CurrentUser() user: RequestUser,
    @Body() dto: SalaryPeriodDto,
  ) {
    return this.workforce.previewSalaries(user, dto);
  }
  @Post('salaries/generate') @RequirePermissions('SALARY_PAY') salaryGenerate(
    @CurrentUser() user: RequestUser,
    @Body() dto: SalaryPeriodDto,
  ) {
    return this.workforce.generateSalaries(user, dto);
  }
  @Get('salaries') @RequirePermissions('SALARY_READ') salaries(
    @CurrentUser() user: RequestUser,
    @Query() query: WorkforceQueryDto,
  ) {
    return this.workforce.listSalaryRecords(user, query);
  }
  @Post('salaries/:id/payments')
  @RequirePermissions('SALARY_PAY')
  salaryPayment(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SalaryPaymentDto,
  ) {
    return this.workforce.recordSalaryPayment(user, id, dto);
  }
  @Post('salaries/:id/adjustments')
  @RequirePermissions('SALARY_PAY')
  salaryAdjustment(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SalaryAdjustmentDto,
  ) {
    return this.workforce.adjustSalary(user, id, dto);
  }
  @Post('salary-payments/:id/reverse')
  @RequirePermissions('SALARY_REVERSE')
  salaryReverse(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SalaryReversalDto,
  ) {
    return this.workforce.reverseSalaryPayment(user, id, dto);
  }
  @Post('salaries/:id/slips') @RequirePermissions('SALARY_PAY') createSlip(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.slips.create(user, id);
  }
  @Get('salary-slips/:id')
  @RequirePermissions('SALARY_READ')
  async downloadSlip(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ) {
    const file = await this.slips.download(user, id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );
    response.send(file.buffer);
  }
  @Public() @Get('salary-slips/verify/:token') verifySlip(
    @Param('token') token: string,
  ) {
    return this.slips.verify(token);
  }

  @Post('worker-categories') @RequirePermissions('WORKER_MANAGE') category(
    @CurrentUser() user: RequestUser,
    @Body() dto: WorkerCategoryDto,
  ) {
    return this.workforce.createWorkerCategory(user, dto);
  }
  @Post('worker-skills') @RequirePermissions('WORKER_MANAGE') skill(
    @CurrentUser() user: RequestUser,
    @Body() dto: WorkerSkillDto,
  ) {
    return this.workforce.createWorkerSkill(user, dto);
  }
  @Post('contractor-companies')
  @RequirePermissions('WORKER_MANAGE')
  contractorCompany(
    @CurrentUser() user: RequestUser,
    @Body() dto: ContractorCompanyDto,
  ) {
    return this.workforce.createContractorCompany(user, dto);
  }
  @Get('worker-setup') @RequirePermissions('WORKER_MANAGE') workerSetup(
    @CurrentUser() user: RequestUser,
  ) {
    return this.workforce.listWorkerSetup(user);
  }
  @Post('workers') @RequirePermissions('WORKER_MANAGE') createWorker(
    @CurrentUser() user: RequestUser,
    @Body() dto: WorkerDto,
  ) {
    return this.workforce.registerWorker(user, dto);
  }
  @Get('workers') @RequirePermissions('WORKER_MANAGE') workers(
    @CurrentUser() user: RequestUser,
    @Query() query: WorkforceQueryDto,
  ) {
    return this.workforce.listWorkers(user, query);
  }
  @Get('workers/:id') @RequirePermissions('WORKER_MANAGE') worker(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workforce.worker(user, id);
  }
  @Post('workers/:id/status/:status')
  @RequirePermissions('WORKER_MANAGE')
  workerStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: string,
    @Body() dto: LifecycleDto,
  ) {
    return this.workforce.transitionWorker(user, id, status, dto);
  }
  @Post('workers/:id/availability')
  @RequirePermissions('WORKER_SCHEDULE')
  availability(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AvailabilityDto,
  ) {
    return this.workforce.addAvailability(user, id, dto);
  }
  @Post('workers/:id/overrides')
  @RequirePermissions('WORKER_SCHEDULE')
  override(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OverrideDto,
  ) {
    return this.workforce.addOverride(user, id, dto);
  }
  @Post('workers/reservations')
  @RequirePermissions('WORKER_SCHEDULE')
  reservation(@CurrentUser() user: RequestUser, @Body() dto: ReservationDto) {
    return this.workforce.reserve(user, dto);
  }
  @Post('workers/eligible') @RequirePermissions('WORKER_SCHEDULE') eligible(
    @CurrentUser() user: RequestUser,
    @Body() dto: EligibilityDto,
  ) {
    return this.workforce.findEligible(user, dto);
  }
  @Post('workers/:id/performance')
  @RequirePermissions('WORKER_PERFORMANCE')
  performance(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PerformanceDto,
  ) {
    return this.workforce.addPerformance(user, id, dto);
  }

  @Post(':ownerType/:ownerId/documents')
  @RequirePermissions('STAFF_DOCUMENT_READ')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { files: 1, fileSize: 20_000_000 } }),
  )
  uploadDocument(
    @CurrentUser() user: RequestUser,
    @Param('ownerType') ownerType: 'staff' | 'worker',
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Body('category') category: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.workforce.uploadDocument(
      user,
      ownerType,
      ownerId,
      category,
      file,
    );
  }
  @Get(':ownerType/:ownerId/documents/:documentId')
  @RequirePermissions('STAFF_DOCUMENT_READ')
  async downloadDocument(
    @CurrentUser() user: RequestUser,
    @Param('ownerType') ownerType: 'staff' | 'worker',
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Res() response: Response,
  ) {
    const file = await this.workforce.downloadDocument(
      user,
      ownerType,
      ownerId,
      documentId,
    );
    response.setHeader('Content-Type', file.mediaType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName.replace(/["\r\n]/g, '_')}"`,
    );
    response.send(file.buffer);
  }

  @Get('dashboard/summary') dashboard(@CurrentUser() user: RequestUser) {
    if (
      !user.permissions.some((p) =>
        ['STAFF_MANAGE', 'WORKER_MANAGE', 'SALARY_READ'].includes(p),
      )
    )
      throw new ForbiddenException(
        'Workforce dashboard access is not permitted.',
      );
    return this.workforce.dashboard(user);
  }
  @Get('exports/:type.csv')
  @RequirePermissions('WORKFORCE_EXPORT')
  async export(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'staff' | 'workers' | 'salaries',
    @Res() response: Response,
  ) {
    const csv = await this.workforce.exportCsv(user, type);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}.csv"`,
    );
    response.send(csv);
  }
}
