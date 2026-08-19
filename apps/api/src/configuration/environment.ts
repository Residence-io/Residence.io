import { z } from 'zod';

const booleanValue = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const optionalBooleanValue = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional()
  .default(false);

const unsafeProductionValue =
  /(change[-_ ]?me|replace[-_ ]?me|example|placeholder|development|test-only|local-only)/i;

export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  APP_VERSION: z.string().min(1).max(80).default('development'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(?:ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL URL'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must contain at least 32 characters'),
  SESSION_COOKIE_NAME: z
    .string()
    .regex(/^[A-Za-z0-9_-]+$/)
    .default('residence_session'),
  SESSION_TTL_MINUTES: z.coerce.number().int().min(5).max(10080).default(480),
  SESSION_COOKIE_SECURE: booleanValue.default(false),
  ARGON2_MEMORY_COST: z.coerce.number().int().min(19456).default(19456),
  ARGON2_TIME_COST: z.coerce.number().int().min(2).max(10).default(3),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
  LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  PASSWORD_RESET_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(1440)
    .default(30),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'log', 'debug', 'verbose'])
    .default('log'),
  TRUST_PROXY: booleanValue.default(false),
  REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(120_000)
    .default(30_000),
  RATE_LIMIT_TTL_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(3_600_000)
    .default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(10).max(10_000).default(120),
  RESIDENCE_SEED_ENABLED: booleanValue.default(false),
  IDENTITY_DATA_KEY: z
    .string()
    .min(32, 'IDENTITY_DATA_KEY must contain at least 32 characters'),
  PRIVATE_STORAGE_ROOT: z.string().default('var/private'),
  RESIDENT_FILE_MAX_BYTES: z.coerce
    .number()
    .int()
    .min(1024)
    .max(20_000_000)
    .default(5_000_000),
  PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
  NOTIFICATION_PROVIDER_MODE: z
    .enum(['sandbox', 'disabled'])
    .default('sandbox'),
  NOTIFICATION_EMAIL_FROM: z
    .string()
    .email()
    .default('no-reply@example.invalid'),
  NOTIFICATION_SMS_SENDER: z.string().min(2).max(20).default('Residence'),
  NOTIFICATION_CALLBACK_SECRET: z.string().min(32).optional(),
  PAYMENT_PROVIDER_MODE: z.enum(['sandbox', 'disabled']).default('sandbox'),
  PAYMENT_SANDBOX_SECRET: z.string().min(32).optional(),
  // Phase S2 — Supabase Auth (all optional; gated by FEATURE_SUPABASE_AUTH)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  SUPABASE_JWT_SECRET: z.string().min(20).optional(),
  FEATURE_SUPABASE_AUTH: optionalBooleanValue,
  FEATURE_SUPABASE_STORAGE: optionalBooleanValue,
  FEATURE_SUPABASE_NOTIFY: optionalBooleanValue,
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  input: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    const names = result.error.issues
      .map((issue) => issue.path.join('.'))
      .join(', ');
    throw new Error(`Invalid application configuration: ${names}`);
  }
  return result.data;
}
