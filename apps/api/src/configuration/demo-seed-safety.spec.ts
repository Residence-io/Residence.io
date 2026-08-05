import { assertDemoSeedAllowed } from '../../prisma/demo-seed-safety';

const valid = {
  NODE_ENV: 'development',
  RESIDENCE_DEMO_DATA: 'true',
  DATABASE_URL: 'local-development-database',
  RESIDENCE_SEED_PASSWORD: 'local-development-passphrase',
};

describe('demo seed safety', () => {
  it('refuses production execution even when explicitly enabled', () => {
    expect(() =>
      assertDemoSeedAllowed({ ...valid, NODE_ENV: 'production' }),
    ).toThrow('disabled in production');
  });

  it('requires an explicit demo-data opt in', () => {
    expect(() =>
      assertDemoSeedAllowed({ ...valid, RESIDENCE_DEMO_DATA: 'false' }),
    ).toThrow('RESIDENCE_DEMO_DATA=true');
  });

  it('accepts a complete non-production local configuration', () => {
    expect(() => assertDemoSeedAllowed(valid)).not.toThrow();
  });
});
