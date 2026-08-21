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
import { BankingService } from './banking.service';
import {
  CreateBankAccountDto,
  UpdateBankAccountDto,
} from '../dto/finance-expansion.dto';
import { RequirePermissions } from '../../authorization/authorization.decorators';
import { CurrentUser } from '../../authorization/current-user.decorator';
import type { RequestUser } from '../../common/request-context';
import { PERMISSIONS } from '@residence/shared';

@ApiTags('finance-banking')
@Controller('finance/banking')
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Get('accounts')
  @RequirePermissions(PERMISSIONS.BANK_ACCOUNT_VIEW)
  listAccounts(
    @CurrentUser() user: RequestUser,
    @Query('onlyActive') onlyActive?: string,
  ) {
    return this.bankingService.listAccounts(
      user.societyId,
      onlyActive === 'true',
    );
  }

  @Get('accounts/:id')
  @RequirePermissions(PERMISSIONS.BANK_ACCOUNT_VIEW)
  getAccount(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bankingService.getAccountById(user.societyId, id);
  }

  @Post('accounts')
  @RequirePermissions(PERMISSIONS.BANK_ACCOUNT_MANAGE)
  createAccount(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.bankingService.createAccount(user.societyId, user.id, dto);
  }

  @Patch('accounts/:id')
  @RequirePermissions(PERMISSIONS.BANK_ACCOUNT_MANAGE)
  updateAccount(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.bankingService.updateAccount(user.societyId, id, user.id, dto);
  }
}
