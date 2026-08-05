import { Prisma } from '../generated/prisma/client';

export const ZERO = new Prisma.Decimal(0);
export type MoneyValue = Prisma.Decimal | string | number;
export function money(value: MoneyValue) {
  return new Prisma.Decimal(value).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}
export function calculateLateFee(
  principal: MoneyValue,
  type: 'NONE' | 'FIXED' | 'PERCENTAGE',
  value: MoneyValue,
) {
  if (type === 'NONE') return ZERO;
  if (type === 'FIXED') return money(value);
  return money(money(principal).mul(value).div(100));
}
export interface AllocatableDue {
  id: string;
  dueDate: Date;
  principalRemaining: MoneyValue;
  lateFeeRemaining: MoneyValue;
}
export function allocateOldestFirst(
  paymentAmount: MoneyValue,
  dues: AllocatableDue[],
) {
  let remaining = money(paymentAmount);
  const allocations: Array<{ dueId: string; amount: Prisma.Decimal }> = [];
  const ordered = [...dues].sort(
    (left, right) =>
      left.dueDate.getTime() - right.dueDate.getTime() ||
      left.id.localeCompare(right.id),
  );
  for (const due of ordered) {
    const outstanding = money(due.principalRemaining).add(
      money(due.lateFeeRemaining),
    );
    if (remaining.lte(0) || outstanding.lte(0)) continue;
    const amount = Prisma.Decimal.min(remaining, outstanding);
    allocations.push({ dueId: due.id, amount: money(amount) });
    remaining = money(remaining.sub(amount));
  }
  return { allocations, advanceCredit: remaining };
}
export function dueStatus(
  total: MoneyValue,
  paid: MoneyValue,
  waived: MoneyValue,
  graceEndsAt: Date,
  now: Date,
) {
  const outstanding = money(total).sub(paid).sub(waived);
  if (outstanding.lte(0)) return money(waived).gte(total) ? 'WAIVED' : 'PAID';
  if (money(paid).gt(0) || money(waived).gt(0)) return 'PARTIALLY_PAID';
  return now > graceEndsAt ? 'OVERDUE' : 'PENDING';
}
