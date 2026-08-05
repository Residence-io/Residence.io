import type { AuthenticatedUser } from '@residence/shared';

export const API_URL = '/api';

export function roleDestination(user: AuthenticatedUser): string {
  if (user.forcePasswordChange) return '/change-password';
  return user.roles.includes('RESIDENT') && user.roles.length === 1
    ? '/resident/dashboard'
    : '/admin/dashboard';
}
