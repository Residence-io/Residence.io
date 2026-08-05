import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CurrentUser } from '../authorization/current-user.decorator';
import { RequirePermissions } from '../authorization/authorization.decorators';
import type { RequestUser } from '../common/request-context';
import {
  CreateResidentDto,
  HouseholdMemberDto,
  LifecycleDto,
  MoveOutDto,
  ProvisionAccountDto,
  ResidentQueryDto,
  UpdateRelatedDto,
  UpdateResidentDto,
  VehicleDto,
} from './dto/resident.dto';
import { ResidentsService } from './residents.service';

@ApiTags('residents')
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residents: ResidentsService) {}

  @Post()
  @RequirePermissions('RESIDENT_CREATE')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateResidentDto) {
    return this.residents.create(user, dto);
  }

  @Post('register')
  @RequirePermissions('RESIDENT_CREATE')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('tenancyAgreement', {
      limits: { files: 1, fileSize: 20_000_000 },
    }),
  )
  async registerWithAgreement(
    @CurrentUser() user: RequestUser,
    @Body('payload') payload: string,
    @UploadedFile() tenancyAgreement?: Express.Multer.File,
  ) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new BadRequestException('The registration payload is invalid.');
    }
    const dto = plainToInstance(CreateResidentDto, parsed);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length)
      throw new BadRequestException(
        'Review the resident registration fields and try again.',
      );
    return this.residents.create(user, dto, tenancyAgreement);
  }

  @Get()
  @RequirePermissions('RESIDENT_READ')
  list(@CurrentUser() user: RequestUser, @Query() query: ResidentQueryDto) {
    return this.residents.list(user, query);
  }

  @Get('me') own(@CurrentUser() user: RequestUser) {
    return this.residents.ownProfile(user);
  }

  @Patch('me') ownUpdate(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateResidentDto,
  ) {
    return this.residents
      .ownProfile(user)
      .then((resident) => this.residents.update(user, resident.id, dto, true));
  }

  @Get(':id')
  detail(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.residents.detail(user, id);
  }

  @Patch(':id')
  @RequirePermissions('RESIDENT_UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResidentDto,
  ) {
    return this.residents.update(user, id, dto);
  }

  @Post(':id/activate')
  @RequirePermissions('RESIDENT_STATUS_CHANGE')
  activate(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LifecycleDto,
  ) {
    return this.residents.activate(user, id, dto);
  }

  @Post(':id/suspend')
  @RequirePermissions('RESIDENT_STATUS_CHANGE')
  suspend(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LifecycleDto,
  ) {
    return this.residents.suspend(user, id, dto);
  }

  @Post(':id/move-out')
  @RequirePermissions('RESIDENT_STATUS_CHANGE')
  moveOut(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveOutDto,
  ) {
    return this.residents.moveOut(user, id, dto);
  }

  @Post(':id/archive')
  @RequirePermissions('RESIDENT_ARCHIVE')
  archive(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LifecycleDto,
  ) {
    return this.residents.archive(user, id, dto);
  }

  @Post(':id/household-members')
  @RequirePermissions('RESIDENT_UPDATE')
  addHousehold(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HouseholdMemberDto,
  ) {
    return this.residents.addHouseholdMember(user, id, dto);
  }

  @Patch(':id/household-members/:memberId')
  @RequirePermissions('RESIDENT_UPDATE')
  updateHousehold(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateRelatedDto,
  ) {
    return this.residents.updateHouseholdMember(user, id, memberId, dto);
  }

  @Post(':id/vehicles')
  @RequirePermissions('RESIDENT_UPDATE')
  addVehicle(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VehicleDto,
  ) {
    return this.residents.addVehicle(user, id, dto);
  }

  @Patch(':id/vehicles/:vehicleId')
  @RequirePermissions('RESIDENT_UPDATE')
  updateVehicle(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: UpdateRelatedDto,
  ) {
    return this.residents.updateVehicle(user, id, vehicleId, dto);
  }

  @Post(':id/account')
  @RequirePermissions('RESIDENT_UPDATE')
  provisionAccount(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProvisionAccountDto,
  ) {
    return this.residents.provisionAccount(user, id, dto);
  }

  @Post(':id/account/revoke-sessions')
  @RequirePermissions('RESIDENT_UPDATE')
  revokeResidentSessions(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.residents.revokeResidentSessions(user, id);
  }

  @Post(':id/account/force-password-reset')
  @RequirePermissions('RESIDENT_UPDATE')
  forceResidentPasswordReset(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.residents.forceResidentPasswordReset(user, id);
  }

  @Post(':id/account/status/:status')
  @RequirePermissions('RESIDENT_UPDATE')
  updateResidentAccountStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: 'ACTIVE' | 'SUSPENDED',
    @Body() body: { reason?: string },
  ) {
    return this.residents.updateResidentAccountStatus(
      user,
      id,
      status,
      body?.reason ?? '',
    );
  }

  @Post(':id/account/temporary-password')
  @RequirePermissions('RESIDENT_UPDATE')
  regenerateResidentTemporaryPassword(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.residents.regenerateResidentTemporaryPassword(user, id);
  }
}
