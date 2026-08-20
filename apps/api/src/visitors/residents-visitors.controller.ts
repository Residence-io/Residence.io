import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';

import { CreateVisitorDto, VisitorPassService } from './visitor-pass.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('visitors/me')
@RequirePermissions(PERMISSIONS.RESIDENT_READ)
export class ResidentsVisitorsController {
  constructor(
    private readonly visitorService: VisitorPassService,
    private readonly prisma: PrismaService,
  ) {}

  private async getResident(userId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { userId: userId, status: 'ACTIVE' },
    });
    if (!resident) {
      throw new Error('Resident profile not found or inactive');
    }
    return resident;
  }

  @Post()
  async createPass(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: CreateVisitorDto,
  ) {
    const resident = await this.getResident(user.id);
    return this.visitorService.createPass(user.societyId, resident.id, data);
  }

  @Get()
  async getMyPasses(@CurrentUser() user: AuthenticatedUser) {
    try {
      const resident = await this.getResident(user.id);
      return this.visitorService.getMyPasses(user.societyId, resident.id);
    } catch {
      return [];
    }
  }

  @Get(':id')
  async getMyPass(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const resident = await this.getResident(user.id);
    return this.visitorService.getMyPass(id, user.societyId, resident.id);
  }

  @Delete(':id')
  async cancelPass(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const resident = await this.getResident(user.id);
    return this.visitorService.cancelPass(id, user.societyId, resident.id);
  }
}
