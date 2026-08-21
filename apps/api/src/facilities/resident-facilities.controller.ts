import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { FacilitiesService } from './facilities.service';
import { FacilityBookingsService } from './facility-bookings.service';
import { CreateBookingDto, CancelBookingDto } from './dto/facility.dto';
import { FacilityBookingStatus } from '../generated/prisma/client';

@Controller()
@RequirePermissions(PERMISSIONS.RESIDENT_READ)
export class ResidentFacilitiesController {
  constructor(
    private readonly facilitiesService: FacilitiesService,
    private readonly bookingsService: FacilityBookingsService,
    private readonly prisma: PrismaService,
  ) {}

  private async getResident(societyId: string, userId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId, userId, status: 'ACTIVE' },
    });
    if (!resident) {
      throw new NotFoundException('Active resident profile not found.');
    }
    return resident;
  }

  @Get('facilities/me')
  async getFacilities(@CurrentUser() user: AuthenticatedUser) {
    return this.facilitiesService.getSocietyFacilities(user.societyId);
  }

  @Get('facilities/me/:id')
  async getFacility(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.facilitiesService.getFacilityById(user.societyId, id);
  }

  @Get('facilities/:id/availability')
  async getAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.bookingsService.getFacilityAvailability(
      user.societyId,
      id,
      date || new Date().toISOString().slice(0, 10),
    );
  }

  @Get('facility-bookings/me')
  async getMyBookings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: FacilityBookingStatus,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.bookingsService.getResidentBookings(
      user.societyId,
      resident.id,
      status,
    );
  }

  @Get('facility-bookings/me/:id')
  async getMyBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.bookingsService.getResidentBookingById(
      user.societyId,
      resident.id,
      id,
    );
  }

  @Post('facility-bookings')
  async createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.bookingsService.createBooking(user.societyId, resident.id, dto);
  }

  @Patch('facility-bookings/me/:id/cancel')
  async cancelBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.bookingsService.cancelResidentBooking(
      user.societyId,
      resident.id,
      id,
      dto,
    );
  }
}
