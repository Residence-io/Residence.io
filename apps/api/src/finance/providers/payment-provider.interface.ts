export interface PaymentIntentResult {
  providerReference: string;
  redirectUrl?: string;
  qrPayload?: string;
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationResult {
  status: 'CONFIRMED' | 'FAILED' | 'PENDING';
  providerReference: string;
  amount: string;
  currency: string;
  completedAt?: Date;
  rawPayload?: any;
}

export interface PaymentProvider {
  readonly providerType: string;
  createPaymentIntent(
    societyId: string,
    residentId: string,
    amount: string,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentIntentResult>;

  verifyPayment(
    societyId: string,
    providerReference: string,
  ): Promise<PaymentVerificationResult>;

  handleWebhook(
    societyId: string,
    payload: any,
    signature?: string,
  ): Promise<PaymentVerificationResult>;
}
