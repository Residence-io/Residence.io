import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../authorization/current-user.decorator';
import { RequirePermissions } from '../authorization/authorization.decorators';
import type { RequestUser } from '../common/request-context';
import {
  ArchiveSettingDto,
  FinancialSettingsDto,
  SETTINGS_SECTIONS,
  SettingsSectionDto,
  type SettingsSection,
} from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermissions('SOCIETY_SETTING_MANAGE')
  list(@CurrentUser() user: RequestUser) {
    return this.settings.listSafe(user);
  }

  @Get('sections/:section')
  @RequirePermissions('SOCIETY_SETTING_MANAGE')
  getSection(
    @CurrentUser() user: RequestUser,
    @Param('section') value: string,
  ) {
    return this.settings.getSection(user, this.section(value));
  }

  @Put('sections/:section')
  @RequirePermissions('SOCIETY_SETTING_MANAGE')
  updateSection(
    @CurrentUser() user: RequestUser,
    @Param('section') value: string,
    @Body() dto: SettingsSectionDto,
  ) {
    return this.settings.updateSection(user, this.section(value), dto);
  }

  @Get('financial')
  @RequirePermissions('BILLING_FEE_MANAGE')
  financial(@CurrentUser() user: RequestUser) {
    return this.settings.listFinancial(user);
  }

  @Post('financial')
  @RequirePermissions('BILLING_FEE_MANAGE')
  createFinancial(
    @CurrentUser() user: RequestUser,
    @Body() dto: FinancialSettingsDto,
  ) {
    return this.settings.createFinancial(user, dto);
  }

  @Delete('financial/:id')
  @RequirePermissions('BILLING_FEE_MANAGE')
  archiveFinancial(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ArchiveSettingDto,
  ) {
    return this.settings.archiveFinancial(user, id, dto.reason);
  }

  private section(value: string): SettingsSection {
    if (!SETTINGS_SECTIONS.includes(value as SettingsSection))
      throw new BadRequestException('Unsupported settings section.');
    return value as SettingsSection;
  }
}
