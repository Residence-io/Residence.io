import type { FailureClassification } from '../../generated/prisma/client';
export interface ProviderMessage {
  destination: string;
  subject?: string;
  content: string;
  idempotencyKey: string;
}
export interface ProviderResult {
  accepted: boolean;
  delivered: boolean;
  providerReference?: string;
  safeResponse: string;
  failureClassification?: FailureClassification;
}
export interface NotificationProvider {
  readonly name: string;
  send(message: ProviderMessage): Promise<ProviderResult>;
}
