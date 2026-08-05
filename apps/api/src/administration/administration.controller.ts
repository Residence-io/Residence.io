import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../authorization/current-user.decorator';
import {
  RequirePermissions,
  Roles,
} from '../authorization/authorization.decorators';
import type { RequestUser } from '../common/request-context';
import { AdministrationService } from './administration.service';
import {
  AssignRolesDto,
  CorrectionRequestDto,
  PageQueryDto,
  ReasonDto,
  ResolveCorrectionDto,
  RolePermissionsDto,
  UserStatusDto,
} from './dto/administration.dto';

@ApiTags('administration')
@Controller('administration')
export class AdministrationController {
  constructor(private readonly administration: AdministrationService) {}

  @Get('users')
  @RequirePermissions('ACCESS_ADMIN_MANAGE')
  users(@CurrentUser() user: RequestUser, @Query() query: PageQueryDto) {
    return this.administration.users(user, query);
  }

  @Patch('users/:id/status')
  @RequirePermissions('ACCESS_ADMIN_MANAGE')
  status(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UserStatusDto,
  ) {
    return this.administration.updateUserStatus(user, id, dto);
  }

  @Patch('users/:id/roles')
  rolesUpdate(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.administration.assignRoles(user, id, dto);
  }

  @Post('users/:id/force-password-reset')
  @RequirePermissions('ACCESS_ADMIN_MANAGE')
  forceReset(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.administration.forcePasswordReset(user, id, dto.reason);
  }

  @Post('users/:id/revoke-sessions')
  @RequirePermissions('ACCESS_ADMIN_MANAGE')
  revokeSessions(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.administration.revokeSessions(user, id, dto.reason);
  }

  @Get('roles')
  @RequirePermissions('ACCESS_ADMIN_MANAGE')
  roles(@CurrentUser() user: RequestUser) {
    return this.administration.roles(user);
  }

  @Get('permissions')
  @RequirePermissions('ACCESS_ROLE_MANAGE')
  permissions() {
    return this.administration.permissions();
  }

  @Patch('roles/:id/permissions')
  @RequirePermissions('ACCESS_ROLE_MANAGE')
  rolePermissions(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RolePermissionsDto,
  ) {
    return this.administration.updateRolePermissions(user, id, dto);
  }

  @Get('audit-logs')
  @RequirePermissions('AUDIT_READ')
  audit(@CurrentUser() user: RequestUser, @Query() query: PageQueryDto) {
    return this.administration.auditLogs(user, query);
  }

  @Get('correction-requests')
  @RequirePermissions('PROFILE_CORRECTION_MANAGE')
  corrections(@CurrentUser() user: RequestUser, @Query() query: PageQueryDto) {
    return this.administration.corrections(user, query);
  }

  @Patch('correction-requests/:id')
  @RequirePermissions('PROFILE_CORRECTION_MANAGE')
  resolve(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveCorrectionDto,
  ) {
    return this.administration.resolveCorrection(user, id, dto);
  }
}

@ApiTags('profile')
@Controller('profile')
@Roles('RESIDENT')
export class ProfileController {
  constructor(private readonly administration: AdministrationService) {}
  @Get('me/security') security(@CurrentUser() user: RequestUser) {
    return this.administration.security(user);
  }
  @Get('me/correction-requests') corrections(@CurrentUser() user: RequestUser) {
    return this.administration.ownCorrections(user);
  }
  @Post('me/correction-requests') create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CorrectionRequestDto,
  ) {
    return this.administration.createCorrection(user, dto);
  }
}
