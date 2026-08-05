import {
  canAssignRoles,
  csvCell,
  redactAuditValue,
  removingLastSuperAdministrator,
} from './administration-policy';

describe('Phase 7 administration policies', () => {
  it('prevents CSV formula execution', () => {
    expect(csvCell('=HYPERLINK("https://invalid")')).toBe(
      '"\'=HYPERLINK(""https://invalid"")"',
    );
    expect(csvCell('+1')).toBe('"\'+1"');
  });

  it('redacts protected audit fields recursively', () => {
    expect(
      redactAuditValue({ action: 'UPDATE', nested: { passwordHash: 'x' } }),
    ).toEqual({ action: 'UPDATE', nested: { passwordHash: '[REDACTED]' } });
  });

  it('protects super-administrator assignment and removal', () => {
    expect(canAssignRoles(['ADMINISTRATOR'], ['SUPER_ADMINISTRATOR'])).toBe(
      false,
    );
    expect(
      canAssignRoles(['SUPER_ADMINISTRATOR'], ['SUPER_ADMINISTRATOR']),
    ).toBe(true);
    expect(removingLastSuperAdministrator(1, true, false)).toBe(true);
    expect(removingLastSuperAdministrator(2, true, false)).toBe(false);
  });
});
