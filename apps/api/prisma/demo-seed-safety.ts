export interface DemoSeedEnvironment {
  NODE_ENV?: string;
  RESIDENCE_DEMO_DATA?: string;
  DATABASE_URL?: string;
  RESIDENCE_SEED_PASSWORD?: string;
}

export function assertDemoSeedAllowed(environment: DemoSeedEnvironment): void {
  if (environment.NODE_ENV === 'production') {
    throw new Error('Demo data seeding is disabled in production.');
  }
  if (environment.RESIDENCE_DEMO_DATA !== 'true') {
    throw new Error(
      'Set RESIDENCE_DEMO_DATA=true explicitly to seed synthetic demo data.',
    );
  }
  if (!environment.DATABASE_URL || !environment.RESIDENCE_SEED_PASSWORD) {
    throw new Error(
      'DATABASE_URL and RESIDENCE_SEED_PASSWORD are required for demo seeding.',
    );
  }
  if (
    environment.RESIDENCE_SEED_PASSWORD.length < 12 ||
    /change[-_ ]?me|placeholder/i.test(environment.RESIDENCE_SEED_PASSWORD)
  ) {
    throw new Error(
      'RESIDENCE_SEED_PASSWORD must be a non-placeholder local password with at least 12 characters.',
    );
  }
}
