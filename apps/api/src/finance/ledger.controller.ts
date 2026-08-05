import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';
import { FinanceQueryDto } from './dto/finance.dto';
import { FinanceService } from './finance.service';
@ApiTags('financial ledger and reports')
@Controller('finance')
export class LedgerController {
  constructor(private readonly finance: FinanceService) {}
  @Get('ledger/me') own(
    @CurrentUser() user: RequestUser,
    @Query() query: FinanceQueryDto,
  ) {
    return this.finance.ledger(user, undefined, query);
  }
  @Get('ledger/:residentId') @RequirePermissions('BILLING_DUE_READ') resident(
    @CurrentUser() user: RequestUser,
    @Param('residentId', ParseUUIDPipe) residentId: string,
    @Query() query: FinanceQueryDto,
  ) {
    return this.finance.ledger(user, residentId, query);
  }
  @Get('dashboard') @RequirePermissions('BILLING_DUE_READ') dashboard(
    @CurrentUser() user: RequestUser,
  ) {
    return this.finance.dashboard(user);
  }
  @Get('dashboard/me') ownDashboard(@CurrentUser() user: RequestUser) {
    return this.finance.dashboard(user, true);
  }
  @Get('exports/payments.csv')
  @RequirePermissions('FINANCIAL_REPORT_EXPORT')
  async export(@CurrentUser() user: RequestUser, @Res() response: Response) {
    const csv = await this.finance.exportCsv(user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="payments.csv"',
    );
    response.send(csv);
  }
}
