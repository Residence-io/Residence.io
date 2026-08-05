import { describe, expect, it } from 'vitest';
import { roleDestination } from './api-client';

const user = {
  id: '1',
  societyId: '1',
  username: 'resident',
  displayName: 'Resident',
  forcePasswordChange: false,
  roles: ['RESIDENT'],
  permissions: [],
  csrfToken: 'token',
};

describe('roleDestination', () => {
  it('routes residents only to their portal', () =>
    expect(roleDestination(user)).toBe('/resident/dashboard'));
  it('enforces the first-login password change', () =>
    expect(roleDestination({ ...user, forcePasswordChange: true })).toBe(
      '/change-password',
    ));
  it('routes administrators to administration', () =>
    expect(roleDestination({ ...user, roles: ['ADMINISTRATOR'] })).toBe(
      '/admin/dashboard',
    ));
});
