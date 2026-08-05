import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface PaymentProvider {
  createIntent(input: {
    internalReference: string;
    amount: string;
    currency: string;
    idempotencyKey: string;
  }): Promise<{ providerReference: string; status: 'PENDING' }>;
  verifyCallback(rawBody: Buffer, signature: string): boolean;
  queryStatus(providerReference: string): Promise<'PENDING'>;
  cancel(providerReference: string): Promise<'CANCELLED'>;
  refund(providerReference: string, amount: string): Promise<'PENDING'>;
}
@Injectable()
export class DevelopmentPaymentProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  private ensureEnabled() {
    if (
      this.config.getOrThrow<string>('payment.providerMode') !== 'sandbox' ||
      !this.config.get<string>('payment.sandboxSecret')
    )
      throw new ServiceUnavailableException(
        'No online payment provider is configured.',
      );
  }
  createIntent(input: {
    internalReference: string;
    amount: string;
    currency: string;
    idempotencyKey: string;
  }) {
    return Promise.resolve().then(() => {
      this.ensureEnabled();
      return {
        providerReference: `sandbox-${input.internalReference}`,
        status: 'PENDING' as const,
      };
    });
  }
  verifyCallback(rawBody: Buffer, signature: string) {
    this.ensureEnabled();
    const expected = createHmac(
      'sha256',
      this.config.getOrThrow<string>('payment.sandboxSecret'),
    )
      .update(rawBody)
      .digest();
    const supplied = Buffer.from(signature, 'hex');
    return (
      supplied.length === expected.length && timingSafeEqual(supplied, expected)
    );
  }
  queryStatus(providerReference: string) {
    void providerReference;
    this.ensureEnabled();
    return Promise.resolve('PENDING' as const);
  }
  cancel(providerReference: string) {
    void providerReference;
    this.ensureEnabled();
    return Promise.resolve('CANCELLED' as const);
  }
  refund(providerReference: string, amount: string) {
    void providerReference;
    void amount;
    this.ensureEnabled();
    return Promise.resolve('PENDING' as const);
  }
}
