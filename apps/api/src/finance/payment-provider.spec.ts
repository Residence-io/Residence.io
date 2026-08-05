import { createHmac } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevelopmentPaymentProvider } from './payment-provider';
describe('development payment provider', () => {
  const provider = (mode = 'sandbox') =>
    new DevelopmentPaymentProvider(
      new ConfigService({
        payment: {
          providerMode: mode,
          sandboxSecret: 'development-only-secret',
        },
      }),
    );
  it('creates only a pending sandbox intent', async () =>
    expect(
      await provider().createIntent({
        internalReference: 'payment-1',
        amount: '100.00',
        currency: 'PKR',
        idempotencyKey: 'intent-1',
      }),
    ).toEqual({ providerReference: 'sandbox-payment-1', status: 'PENDING' }));
  it('verifies an authentic callback signature', () => {
    const body = Buffer.from('{"event":"paid"}');
    const signature = createHmac('sha256', 'development-only-secret')
      .update(body)
      .digest('hex');
    expect(provider().verifyCallback(body, signature)).toBe(true);
  });
  it('rejects a mismatched callback signature', () =>
    expect(provider().verifyCallback(Buffer.from('body'), '00')).toBe(false));
  it('cannot run when the sandbox provider is disabled', async () => {
    await expect(
      provider('disabled').createIntent({
        internalReference: 'payment-1',
        amount: '100.00',
        currency: 'PKR',
        idempotencyKey: 'intent-1',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
