import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FailureClassification } from '../../generated/prisma/client';
import type {
  NotificationProvider,
  ProviderMessage,
  ProviderResult,
} from './notification-provider';

abstract class SandboxProvider implements NotificationProvider {
  abstract readonly name: string;
  constructor(protected readonly config: ConfigService) {}
  send(message: ProviderMessage): Promise<ProviderResult> {
    void message;
    return Promise.resolve({
      accepted: false,
      delivered: false,
      safeResponse: 'Sandbox only: no external message was delivered.',
      failureClassification: FailureClassification.PROVIDER_DISABLED,
    });
  }
}
@Injectable()
export class SandboxEmailProvider extends SandboxProvider {
  readonly name = 'sandbox-email';
}
@Injectable()
export class SandboxSmsProvider extends SandboxProvider {
  readonly name = 'sandbox-sms';
  static normalize(phone: string): string {
    const normalized = phone.replace(/[ ()-]/g, '');
    if (!/^\+[1-9][0-9]{7,14}$/.test(normalized))
      throw new Error('Phone number must use international format.');
    return normalized;
  }
}
