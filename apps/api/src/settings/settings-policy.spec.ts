import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FinancialSettingsDto } from './dto/settings.dto';
import {
  assertSafeConfiguration,
  redactConfiguration,
} from './settings-policy';

describe('Phase 7 settings policies', () => {
  it('rejects secret-like configuration fields', () => {
    expect(() => assertSafeConfiguration({ smtpPassword: 'unsafe' })).toThrow(
      'Secrets and unsafe configuration keys are not accepted.',
    );
  });

  it('redacts secrets from safe API output', () => {
    expect(redactConfiguration({ provider: { apiToken: 'x' } })).toEqual({
      provider: { apiToken: '[REDACTED]' },
    });
  });

  it('validates financial configuration boundaries', async () => {
    const dto = plainToInstance(FinancialSettingsDto, {
      defaultMonthlyFee: '-1',
      dueDay: 31,
      gracePeriodDays: -1,
      lateFeePolicy: {},
      allocationStrategy: 'INVALID',
      receiptPrefix: '',
      receiptSequenceStart: 0,
      supportedPaymentMethods: [],
      advancePaymentPolicy: {},
      refundAndReversalPolicy: {},
      currency: 'PK',
      roundingScale: 8,
      effectiveFrom: 'invalid',
    });
    expect((await validate(dto)).length).toBeGreaterThan(5);
  });
});
