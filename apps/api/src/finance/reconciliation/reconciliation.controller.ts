import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service';
import {
  MatchBankStatementLineDto,
  CreateReconciliationDto,
} from '../dto/finance-expansion.dto';
import { RequirePermissions } from '../../authorization/authorization.decorators';
import { CurrentUser } from '../../authorization/current-user.decorator';
import type { RequestUser } from '../../common/request-context';
import { PERMISSIONS } from '@residence/shared';
import { BankStatementLineStatus } from '../../generated/prisma/client';

@ApiTags('finance-reconciliation')
@Controller('finance/reconciliation')
export class ReconciliationController {
  constructor(private readonly recService: ReconciliationService) {}

  @Post('import')
  @RequirePermissions(PERMISSIONS.BANK_RECONCILE)
  importCsv(
    @CurrentUser() user: RequestUser,
    @Body()
    body: { bankAccountId: string; fileName: string; csvContent: string },
  ) {
    return this.recService.importStatementCsv(
      user.societyId,
      user.id,
      body.bankAccountId,
      body.fileName,
      body.csvContent,
    );
  }

  @Get('lines')
  @RequirePermissions(PERMISSIONS.BANK_RECONCILE)
  listLines(
    @CurrentUser() user: RequestUser,
    @Query('bankAccountId') bankAccountId: string,
    @Query('status') status?: BankStatementLineStatus,
  ) {
    return this.recService.listStatementLines(
      user.societyId,
      bankAccountId,
      status,
    );
  }

  @Post('lines/:id/match')
  @RequirePermissions(PERMISSIONS.BANK_RECONCILE)
  matchLine(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: MatchBankStatementLineDto,
  ) {
    return this.recService.matchStatementLine(user.societyId, id, user.id, dto);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BANK_RECONCILE)
  createReconciliation(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateReconciliationDto,
  ) {
    return this.recService.createReconciliation(user.societyId, user.id, dto);
  }
}
