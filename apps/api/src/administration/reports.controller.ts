import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../authorization/current-user.decorator';
import { RequirePermissions } from '../authorization/authorization.decorators';
import type { RequestUser } from '../common/request-context';
import { DashboardPeriodDto, PageQueryDto } from './dto/administration.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get() @RequirePermissions('REPORT_READ') catalog(
    @CurrentUser() user: RequestUser,
  ) {
    return this.reports.catalog(user);
  }
  @Get('dashboard/admin') @RequirePermissions('REPORT_READ') adminDashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: DashboardPeriodDto,
  ) {
    return this.reports.adminDashboard(user, query);
  }
  @Get('dashboard/me') residentDashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: DashboardPeriodDto,
  ) {
    return this.reports.residentDashboard(user, query);
  }
  @Get(':report.csv')
  @RequirePermissions('REPORT_EXPORT')
  async csv(
    @CurrentUser() user: RequestUser,
    @Param('report') report: string,
    @Query() query: PageQueryDto,
    @Res() response: Response,
  ) {
    const csv = await this.reports.csv(user, report, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${report}.csv"`,
    );
    response.send(csv);
  }
  @Get(':report')
  @RequirePermissions('REPORT_READ')
  run(
    @CurrentUser() user: RequestUser,
    @Param('report') report: string,
    @Query() query: PageQueryDto,
  ) {
    return this.reports.run(user, report, query);
  }
}
