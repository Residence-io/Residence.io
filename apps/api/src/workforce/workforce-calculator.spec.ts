import {
  localScheduleParts,
  salaryNet,
  windowContains,
} from './workforce-calculator';

describe('workforce calculations', () => {
  it('calculates salary using decimal half-up arithmetic', () =>
    expect(salaryNet('1000.005', '125.115', '25.005', '10').toFixed(2)).toBe(
      '1110.12',
    ));
  it('checks complete working-window containment', () => {
    expect(windowContains(540, 1020, 600, 660)).toBe(true);
    expect(windowContains(540, 1020, 500, 660)).toBe(false);
  });
  it('uses the society time zone for scheduling', () =>
    expect(
      localScheduleParts(new Date('2026-07-16T05:30:00Z'), 'Asia/Karachi'),
    ).toEqual({
      dayOfWeek: 4,
      minute: 630,
    }));
});
