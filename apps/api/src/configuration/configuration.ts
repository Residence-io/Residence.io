import type { Environment } from './environment';

export function configuration(env: Environment) {
  return {
    app: {
      environment: env.NODE_ENV,
      port: env.API_PORT,
      version: env.APP_VERSION,
      webOrigin: env.WEB_ORIGIN,
      logLevel: env.LOG_LEVEL,
      trustProxy: env.TRUST_PROXY,
      requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
      rateLimitTtlMs: env.RATE_LIMIT_TTL_MS,
      rateLimitMax: env.RATE_LIMIT_MAX,
    },
    database: { url: env.DATABASE_URL },
    session: {
      secret: env.SESSION_SECRET,
      cookieName: env.SESSION_COOKIE_NAME,
      ttlMinutes: env.SESSION_TTL_MINUTES,
      secure: env.SESSION_COOKIE_SECURE,
    },
    password: {
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      resetTtlMinutes: env.PASSWORD_RESET_TTL_MINUTES,
    },
    authentication: {
      maxAttempts: env.LOGIN_MAX_ATTEMPTS,
      lockMinutes: env.LOGIN_LOCK_MINUTES,
    },
    seed: { enabled: env.RESIDENCE_SEED_ENABLED },
    resident: {
      identityDataKey: env.IDENTITY_DATA_KEY,
      publicWebUrl: env.PUBLIC_WEB_URL,
      storage: {
        root: env.PRIVATE_STORAGE_ROOT,
        maxBytes: env.RESIDENT_FILE_MAX_BYTES,
      },
    },
    notification: {
      providerMode: env.NOTIFICATION_PROVIDER_MODE,
      emailFrom: env.NOTIFICATION_EMAIL_FROM,
      smsSender: env.NOTIFICATION_SMS_SENDER,
      callbackSecret: env.NOTIFICATION_CALLBACK_SECRET,
    },
    payment: {
      providerMode: env.PAYMENT_PROVIDER_MODE,
      sandboxSecret: env.PAYMENT_SANDBOX_SECRET,
    },
    // Phase S2/S4 — Supabase Auth + Storage
    supabase: {
      url: env.SUPABASE_URL ?? '',
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      jwtSecret: env.SUPABASE_JWT_SECRET ?? '',
      authEnabled: env.FEATURE_SUPABASE_AUTH ?? false,
      storageEnabled: env.FEATURE_SUPABASE_STORAGE ?? false,
      notifyEnabled: env.FEATURE_SUPABASE_NOTIFY ?? false,
    },
  };
}
