import { Prisma } from '../generated/prisma/client';

export const workforceMoney = (value: Prisma.Decimal | string | number) =>
  new Prisma.Decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

export function salaryNet(
  basic: Prisma.Decimal | string,
  allowances: Prisma.Decimal | string,
  deductions: Prisma.Decimal | string,
  adjustment: Prisma.Decimal | string = '0',
) {
  return workforceMoney(
    workforceMoney(basic)
      .add(workforceMoney(allowances))
      .sub(workforceMoney(deductions))
      .add(workforceMoney(adjustment)),
  );
}

export function localScheduleParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    dayOfWeek: weekdays.indexOf(value('weekday')),
    minute: Number(value('hour')) * 60 + Number(value('minute')),
  };
}

export function windowContains(
  startMinute: number,
  endMinute: number,
  requestedStart: number,
  requestedEnd: number,
) {
  return startMinute <= requestedStart && endMinute >= requestedEnd;
}
