import {
  canTransition,
  safeDisclosure,
  slaTargets,
  withinReopenWindow,
} from './ticket-workflow';

describe('ticket workflow policy', () => {
  it('keeps complaint and maintenance transitions explicit', () => {
    expect(canTransition('complaint', 'SUBMITTED', 'UNDER_REVIEW')).toBe(true);
    expect(canTransition('complaint', 'SUBMITTED', 'CLOSED')).toBe(false);
    expect(canTransition('maintenance', 'APPROVED', 'ASSIGNED')).toBe(true);
    expect(canTransition('maintenance', 'SUBMITTED', 'WORK_IN_PROGRESS')).toBe(
      false,
    );
  });
  it('calculates deterministic SLA targets', () => {
    const value = slaTargets(new Date('2026-01-01T00:00:00Z'), 60, 240);
    expect(value.targetResponseAt.toISOString()).toBe(
      '2026-01-01T01:00:00.000Z',
    );
    expect(value.targetResolutionAt.toISOString()).toBe(
      '2026-01-01T04:00:00.000Z',
    );
  });
  it('enforces the reopening window', () => {
    const completed = new Date('2026-01-01T00:00:00Z');
    expect(
      withinReopenWindow(completed, new Date('2026-01-14T00:00:00Z')),
    ).toBe(true);
    expect(
      withinReopenWindow(completed, new Date('2026-01-16T00:00:00Z')),
    ).toBe(false);
  });
  it('limits contact disclosure to operational fields', () => {
    expect(safeDisclosure('worker')).not.toContain('identityNumber');
    expect(safeDisclosure('resident')).not.toContain('salary');
  });
});
