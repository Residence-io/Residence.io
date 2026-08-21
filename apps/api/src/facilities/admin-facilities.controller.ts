import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { FacilitiesService } from './facilities.service';
import { FacilityBookingsService } from './facility-bookings.service';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
  CreateBlockoutDto,
  RejectBookingDto,
  QueryBookingsDto,
} from './dto/facility.dto';
import { FacilityStatus } from '../generated/prisma/client';

@Controller('admin')
export class AdminFacilitiesController {
  constructor(
    private readonly facilitiesService: FacilitiesService,
    private readonly bookingsService: FacilityBookingsService,
  ) {}

  @Get('facilities')
  @RequirePermissions(PERMISSIONS.FACILITY_VIEW)
  async getFacilities(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: FacilityStatus,
  ) {
    return this.facilitiesService.getSocietyFacilities(user.societyId, status);
  }

  @Post('facilities')
  @RequirePermissions(PERMISSIONS.FACILITY_CREATE)
  async createFacility(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFacilityDto,
  ) {
    return this.facilitiesService.createFacility(user.societyId, user.id, dto);
  }

  @Get('facilities/:id')
  @RequirePermissions(PERMISSIONS.FACILITY_VIEW)
  async getFacility(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.facilitiesService.getFacilityById(user.societyId, id);
  }

  @Patch('facilities/:id')
  @RequirePermissions(PERMISSIONS.FACILITY_UPDATE)
  async updateFacility(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFacilityDto,
  ) {
    return this.facilitiesService.updateFacility(
      user.societyId,
      id,
      user.id,
      dto,
    );
  }

  @Post('facilities/:id/blockouts')
  @RequirePermissions(PERMISSIONS.FACILITY_MANAGE)
  async createBlockout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateBlockoutDto,
  ) {
    return this.facilitiesService.createBlockout(
      user.societyId,
      id,
      user.id,
      dto,
    );
  }

  @Delete('facilities/:id/blockouts/:blockoutId')
  @RequirePermissions(PERMISSIONS.FACILITY_MANAGE)
  async deleteBlockout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('blockoutId') blockoutId: string,
  ) {
    return this.facilitiesService.deleteBlockout(
      user.societyId,
      id,
      blockoutId,
      user.id,
    );
  }

  @Get('facility-bookings')
  @RequirePermissions(PERMISSIONS.FACILITY_BOOKING_VIEW)
  async getBookings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryBookingsDto,
  ) {
    return this.bookingsService.getAdminBookings(user.societyId, query);
  }

  @Get('facility-bookings/:id')
  @RequirePermissions(PERMISSIONS.FACILITY_BOOKING_VIEW)
  async getBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.getAdminBookingById(user.societyId, id);
  }

  @Patch('facility-bookings/:id/approve')
  @RequirePermissions(PERMISSIONS.FACILITY_BOOKING_APPROVE)
  async approveBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.approveBooking(user.societyId, id, user.id);
  }

  @Patch('facility-bookings/:id/reject')
  @RequirePermissions(PERMISSIONS.FACILITY_BOOKING_APPROVE)
  async rejectBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectBookingDto,
  ) {
    return this.bookingsService.rejectBooking(user.societyId, id, user.id, dto);
  }

  @Patch('facility-bookings/:id/complete')
  @RequirePermissions(PERMISSIONS.FACILITY_BOOKING_MANAGE)
  async completeBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.completeBooking(user.societyId, id, user.id);
  }

  @Patch('facility-bookings/:id/no-show')
  @RequirePermissions(PERMISSIONS.FACILITY_BOOKING_MANAGE)
  async noShowBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.noShowBooking(user.societyId, id, user.id);
  }
}
