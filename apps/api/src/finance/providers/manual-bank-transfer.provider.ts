import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentIntentResult,
  PaymentVerificationResult,
} from './payment-provider.interface';
import { randomBytes } from 'node:crypto';

@Injectable()
export class ManualBankTransferProvider implements PaymentProvider {
  readonly providerType = 'BANK_TRANSFER';

  createPaymentIntent(
    societyId: string,
    residentId: string,
    amount: string,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentIntentResult> {
    const providerReference = `BT-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    return Promise.resolve({
      providerReference,
      instructions:
        'Please transfer funds to the designated society bank account and upload the deposit receipt.',
      metadata: { societyId, residentId, amount, currency, ...metadata },
    });
  }

  verifyPayment(
    societyId: string,
    providerReference: string,
  ): Promise<PaymentVerificationResult> {
    void societyId;
    return Promise.resolve({
      status: 'PENDING',
      providerReference,
      amount: '0.00',
      currency: 'PKR',
    });
  }

  handleWebhook(
    societyId: string,
    payload: any,
  ): Promise<PaymentVerificationResult> {
    void societyId;
    return Promise.resolve({
      status: 'PENDING',
      providerReference: (payload?.providerReference as string) || 'UNKNOWN',
      amount: (payload?.amount as string) || '0.00',
      currency: (payload?.currency as string) || 'PKR',
    });
  }
}
