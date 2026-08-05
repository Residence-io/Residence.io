import { Module } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import { SessionAuthGuard } from './session-auth.guard';

@Module({
  providers: [SessionAuthGuard, RolesGuard, PermissionsGuard, CsrfGuard],
  exports: [SessionAuthGuard, RolesGuard, PermissionsGuard, CsrfGuard],
})
export class AuthorizationModule {}
