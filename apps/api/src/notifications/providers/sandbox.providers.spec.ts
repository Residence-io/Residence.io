import { ConfigService } from '@nestjs/config';
import { FailureClassification } from '../../generated/prisma/client';
import { SandboxEmailProvider, SandboxSmsProvider } from './sandbox.providers';

describe('notification sandbox providers', () => {
  const config = new ConfigService({ environment: 'development' });
  it('never claims email delivery', async () =>
    expect(
      await new SandboxEmailProvider(config).send({
        destination: 'a@example.test',
        content: 'x',
        idempotencyKey: 'k',
      }),
    ).toMatchObject({
      accepted: false,
      delivered: false,
      failureClassification: FailureClassification.PROVIDER_DISABLED,
    }));
  it('never claims SMS delivery', async () =>
    expect(
      await new SandboxSmsProvider(config).send({
        destination: '+923001234567',
        content: 'x',
        idempotencyKey: 'k',
      }),
    ).toMatchObject({ accepted: false, delivered: false }));
  it('normalizes international numbers', () =>
    expect(SandboxSmsProvider.normalize('+92 300-1234567')).toBe(
      '+923001234567',
    ));
  it('rejects local ambiguous numbers', () =>
    expect(() => SandboxSmsProvider.normalize('03001234567')).toThrow(
      'international format',
    ));
});
