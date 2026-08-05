import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'residence.public';
export const ROLES_KEY = 'residence.roles';
export const PERMISSIONS_KEY = 'residence.permissions';
export const ALLOW_FORCED_CHANGE_KEY = 'residence.allowForcedChange';

export const Public = () => SetMetadata(PUBLIC_KEY, true);
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
export const AllowForcedPasswordChange = () =>
  SetMetadata(ALLOW_FORCED_CHANGE_KEY, true);
