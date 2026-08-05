import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('accepts the required safe configuration', () => {
    const env = validateEnvironment({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/residence',
      SESSION_SECRET: 'a'.repeat(32),
      IDENTITY_DATA_KEY: 'b'.repeat(32),
      PAYMENT_PROVIDER_MODE: 'disabled',
    });
    expect(env.API_PORT).toBe(3001);
  });

  it('rejects missing or invalid required values without echoing them', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'mysql://localhost/db',
        SESSION_SECRET: 'short',
        IDENTITY_DATA_KEY: 'b'.repeat(32),
        PAYMENT_PROVIDER_MODE: 'disabled',
      }),
    ).toThrow('DATABASE_URL, SESSION_SECRET');
  });

  it('requires secure cookies and disabled seeding in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/residence',
        SESSION_SECRET: 'a'.repeat(32),
        IDENTITY_DATA_KEY: 'b'.repeat(32),
        SESSION_COOKIE_SECURE: 'false',
        RESIDENCE_SEED_ENABLED: 'true',
        PAYMENT_PROVIDER_MODE: 'sandbox',
        PAYMENT_SANDBOX_SECRET: 'a'.repeat(32),
      }),
    ).toThrow(
      'SESSION_COOKIE_SECURE, PAYMENT_PROVIDER_MODE, NOTIFICATION_PROVIDER_MODE, RESIDENCE_SEED_ENABLED',
    );
  });

  it('rejects recognizable placeholder secrets in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@database:5432/residence',
        SESSION_SECRET: 'change-me-session-secret-at-least-32-characters',
        IDENTITY_DATA_KEY: 'b'.repeat(32),
        SESSION_COOKIE_SECURE: 'true',
        NOTIFICATION_PROVIDER_MODE: 'disabled',
        PAYMENT_PROVIDER_MODE: 'disabled',
      }),
    ).toThrow('SESSION_SECRET');
  });
});
