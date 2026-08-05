import 'reflect-metadata';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
  'postgresql://test:test@localhost:5432/residence_test';
process.env.IDENTITY_DATA_KEY ??=
  'test-only-identity-key-at-least-32-characters';
process.env.SESSION_SECRET ??=
  'test-session-secret-that-is-at-least-32-characters';
process.env.PAYMENT_PROVIDER_MODE ??= 'disabled';
