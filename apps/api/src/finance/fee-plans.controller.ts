import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';
import {
  AssignFeePlanDto,
  CreateFeePlanDto,
  DecisionDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';
@ApiTags('fee plans')
@Controller('fee-plans')
export class FeePlansController {
  constructor(private readonly finance: FinanceService) {}
  @Post() @RequirePermissions('BILLING_FEE_MANAGE') create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateFeePlanDto,
  ) {
    return this.finance.createFeePlan(user, dto);
  }
  @Get() @RequirePermissions('BILLING_DUE_READ') list(
    @CurrentUser() user: RequestUser,
  ) {
    return this.finance.listFeePlans(user);
  }
  @Post('assignments') @RequirePermissions('BILLING_FEE_MANAGE') assign(
    @CurrentUser() user: RequestUser,
    @Body() dto: AssignFeePlanDto,
  ) {
    return this.finance.assignFeePlan(user, dto);
  }
  @Post(':id/deactivate') @RequirePermissions('BILLING_FEE_MANAGE') deactivate(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionDto,
  ) {
    return this.finance.deactivateFeePlan(user, id, dto.reason);
  }
}
