import { dashboardWindow, monthlySeries } from './dashboard-period';

describe('dashboard period helpers', () => {
  it('bounds the twelve-month window and includes empty months', () => {
    const window = dashboardWindow('12m', new Date('2026-07-28T12:00:00.000Z'));

    expect(window.start.toISOString()).toBe('2025-08-01T00:00:00.000Z');
    expect(window.labels).toHaveLength(12);
    expect(
      monthlySeries(window.labels, [
        { month: '2026-07-01T00:00:00.000Z', value: '125.50' },
      ]).at(-1),
    ).toEqual({ key: '2026-07', label: 'Jul 26', value: 125.5 });
  });
});
