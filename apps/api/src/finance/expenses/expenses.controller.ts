import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  ReviewExpenseDto,
  PayExpenseDto,
} from '../dto/finance-expansion.dto';
import { RequirePermissions } from '../../authorization/authorization.decorators';
import { CurrentUser } from '../../authorization/current-user.decorator';
import type { RequestUser } from '../../common/request-context';
import { PERMISSIONS } from '@residence/shared';
import { ExpenseStatus } from '../../generated/prisma/client';

@ApiTags('finance-expenses')
@Controller('finance/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.EXPENSE_VIEW)
  listExpenses(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: ExpenseStatus,
    @Query('category') category?: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.listExpenses(user.societyId, {
      status,
      category,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EXPENSE_VIEW)
  getExpense(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.expensesService.getExpenseById(user.societyId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.EXPENSE_CREATE)
  createExpense(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.createExpense(user.societyId, user.id, dto);
  }

  @Patch(':id/review')
  @RequirePermissions(PERMISSIONS.EXPENSE_APPROVE)
  reviewExpense(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReviewExpenseDto,
  ) {
    return this.expensesService.reviewExpense(user.societyId, id, user.id, dto);
  }

  @Post(':id/pay')
  @RequirePermissions(PERMISSIONS.EXPENSE_PAY)
  payExpense(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: PayExpenseDto,
  ) {
    return this.expensesService.payExpense(user.societyId, id, user.id, dto);
  }

  @Post(':id/void')
  @RequirePermissions(PERMISSIONS.EXPENSE_MANAGE)
  voidExpense(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.expensesService.voidExpense(
      user.societyId,
      id,
      user.id,
      reason || 'Voided by admin',
    );
  }
}
