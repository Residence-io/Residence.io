import {
  allocateOldestFirst,
  calculateLateFee,
  dueStatus,
  money,
} from './financial-calculator';
describe('financial calculator', () => {
  it('rounds half up', () => expect(money('10.125').toFixed(2)).toBe('10.13'));
  it('calculates fixed late fees', () =>
    expect(calculateLateFee('100', 'FIXED', '25').toFixed(2)).toBe('25.00'));
  it('calculates percentage late fees', () =>
    expect(calculateLateFee('99.99', 'PERCENTAGE', '10').toFixed(2)).toBe(
      '10.00',
    ));
  it('disables late fees', () =>
    expect(calculateLateFee('100', 'NONE', '25').toFixed(2)).toBe('0.00'));
  it('allocates oldest first', () =>
    expect(
      allocateOldestFirst('150', [
        {
          id: 'new',
          dueDate: new Date('2026-02-01'),
          principalRemaining: '100',
          lateFeeRemaining: '0',
        },
        {
          id: 'old',
          dueDate: new Date('2026-01-01'),
          principalRemaining: '100',
          lateFeeRemaining: '0',
        },
      ]).allocations.map((x) => [x.dueId, x.amount.toFixed(2)]),
    ).toEqual([
      ['old', '100.00'],
      ['new', '50.00'],
    ]));
  it('preserves advance credit', () =>
    expect(
      allocateOldestFirst('125', [
        {
          id: 'due',
          dueDate: new Date(),
          principalRemaining: '100',
          lateFeeRemaining: '0',
        },
      ]).advanceCredit.toFixed(2),
    ).toBe('25.00'));
  it('never overallocates', () =>
    expect(
      allocateOldestFirst('110', [
        {
          id: 'due',
          dueDate: new Date(),
          principalRemaining: '100',
          lateFeeRemaining: '20',
        },
      ]).allocations[0].amount.toFixed(2),
    ).toBe('110.00'));
  it('marks paid dues', () =>
    expect(
      dueStatus(
        '100',
        '100',
        '0',
        new Date('2026-01-10'),
        new Date('2026-01-01'),
      ),
    ).toBe('PAID'));
  it('marks waived dues', () =>
    expect(
      dueStatus(
        '100',
        '0',
        '100',
        new Date('2026-01-10'),
        new Date('2026-01-01'),
      ),
    ).toBe('WAIVED'));
  it('marks partial dues', () =>
    expect(
      dueStatus(
        '100',
        '10',
        '0',
        new Date('2026-01-10'),
        new Date('2026-01-01'),
      ),
    ).toBe('PARTIALLY_PAID'));
  it('marks overdue dues', () =>
    expect(
      dueStatus(
        '100',
        '0',
        '0',
        new Date('2026-01-01'),
        new Date('2026-01-02'),
      ),
    ).toBe('OVERDUE'));
  it('keeps grace-period dues pending', () =>
    expect(
      dueStatus(
        '100',
        '0',
        '0',
        new Date('2026-01-02'),
        new Date('2026-01-01'),
      ),
    ).toBe('PENDING'));
});
