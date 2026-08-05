import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFeePlanDto, PaymentDto } from './finance.dto';
describe('finance DTO validation', () => {
  it('accepts exact two-decimal monetary input', async () =>
    expect(
      await validate(
        plainToInstance(PaymentDto, {
          residentId: 'd9428888-122b-4f90-9e54-e035f7ef1422',
          amount: '100.25',
          currency: 'PKR',
          method: 'CASH',
          allocationStrategy: 'OLDEST_DUE_FIRST',
          idempotencyKey: 'payment-key-1',
        }),
      ),
    ).toHaveLength(0));
  it('rejects floating point and excess precision input', async () =>
    expect(
      (
        await validate(
          plainToInstance(PaymentDto, {
            residentId: 'd9428888-122b-4f90-9e54-e035f7ef1422',
            amount: '10.999',
            currency: 'PKR',
            method: 'CASH',
            allocationStrategy: 'OLDEST_DUE_FIRST',
            idempotencyKey: 'payment-key-1',
          }),
        )
      ).length,
    ).toBeGreaterThan(0));
  it('requires unit IDs for unit-scoped plans', async () =>
    expect(
      (
        await validate(
          plainToInstance(CreateFeePlanDto, {
            name: 'Unit plan',
            scope: 'UNIT',
            monthlyBaseAmount: '100',
            currency: 'PKR',
            effectiveFrom: '2026-01-01',
            dueDay: 10,
            gracePeriodDays: 0,
            lateFeeType: 'NONE',
            lateFeeValue: '0',
            lateFeeRecurring: false,
          }),
        )
      ).length,
    ).toBeGreaterThan(0));
  it('rejects invalid currency codes', async () =>
    expect(
      (
        await validate(
          plainToInstance(PaymentDto, {
            residentId: 'd9428888-122b-4f90-9e54-e035f7ef1422',
            amount: '100',
            currency: 'pkr',
            method: 'CASH',
            allocationStrategy: 'OLDEST_DUE_FIRST',
            idempotencyKey: 'payment-key-1',
          }),
        )
      ).length,
    ).toBeGreaterThan(0));
});
