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
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from '../dto/finance-expansion.dto';
import { RequirePermissions } from '../../authorization/authorization.decorators';
import { CurrentUser } from '../../authorization/current-user.decorator';
import type { RequestUser } from '../../common/request-context';
import { PERMISSIONS } from '@residence/shared';
import { VendorStatus } from '../../generated/prisma/client';

@ApiTags('finance-vendors')
@Controller('finance/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VENDOR_VIEW)
  listVendors(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: VendorStatus,
  ) {
    return this.vendorsService.listVendors(user.societyId, status);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VENDOR_VIEW)
  getVendor(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.vendorsService.getVendorById(user.societyId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.VENDOR_MANAGE)
  createVendor(@CurrentUser() user: RequestUser, @Body() dto: CreateVendorDto) {
    return this.vendorsService.createVendor(user.societyId, user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.VENDOR_MANAGE)
  updateVendor(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorsService.updateVendor(user.societyId, id, user.id, dto);
  }
}
