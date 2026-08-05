import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';
import {
  AdjustmentDto,
  FinanceQueryDto,
  GenerateDuesDto,
  PeriodDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';
@ApiTags('dues')
@Controller('dues')
export class DuesController {
  constructor(private readonly finance: FinanceService) {}
  @Post('preview') @RequirePermissions('BILLING_FEE_MANAGE') preview(
    @CurrentUser() user: RequestUser,
    @Body() dto: PeriodDto,
  ) {
    return this.finance.previewDues(user, dto);
  }
  @Post('generate') @RequirePermissions('BILLING_FEE_MANAGE') generate(
    @CurrentUser() user: RequestUser,
    @Body() dto: GenerateDuesDto,
  ) {
    return this.finance.generateDues(user, dto);
  }
  @Post('late-fees/apply') @RequirePermissions('PAYMENT_ADJUST') lateFees(
    @CurrentUser() user: RequestUser,
  ) {
    return this.finance.applyLateFees(user);
  }
  @Get() @RequirePermissions('BILLING_DUE_READ') list(
    @CurrentUser() user: RequestUser,
    @Query() query: FinanceQueryDto,
  ) {
    return this.finance.listDues(user, query);
  }
  @Get('me') own(
    @CurrentUser() user: RequestUser,
    @Query() query: FinanceQueryDto,
  ) {
    return this.finance.listDues(user, query, true);
  }
  @Post(':id/adjustments') @RequirePermissions('PAYMENT_ADJUST') adjust(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustmentDto,
  ) {
    return this.finance.adjustDue(user, id, dto);
  }
}
