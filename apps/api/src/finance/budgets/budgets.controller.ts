import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto/finance-expansion.dto';
import { RequirePermissions } from '../../authorization/authorization.decorators';
import { CurrentUser } from '../../authorization/current-user.decorator';
import type { RequestUser } from '../../common/request-context';
import { PERMISSIONS } from '@residence/shared';

@ApiTags('finance-budgets')
@Controller('finance/budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BUDGET_VIEW)
  listBudgets(@CurrentUser() user: RequestUser) {
    return this.budgetsService.listBudgets(user.societyId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BUDGET_VIEW)
  getBudget(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.budgetsService.getBudgetById(user.societyId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BUDGET_MANAGE)
  createBudget(@CurrentUser() user: RequestUser, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.createBudget(user.societyId, user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BUDGET_MANAGE)
  updateBudget(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.updateBudget(user.societyId, id, user.id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.BUDGET_APPROVE)
  approveBudget(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.budgetsService.approveBudget(user.societyId, id, user.id);
  }
}
