const SENSITIVE_KEY =
  /(secret|password|token|private.?key|credential|connection.?string)/i;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function redactConfiguration(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactConfiguration);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !DANGEROUS_KEYS.has(key))
      .map(([key, entry]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactConfiguration(entry),
      ]),
  );
}

export function assertSafeConfiguration(value: unknown): void {
  if (!value || typeof value !== 'object')
    throw new Error('Settings must be an object.');
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key) || SENSITIVE_KEY.test(key)) {
      throw new Error(
        'Secrets and unsafe configuration keys are not accepted.',
      );
    }
    if (entry && typeof entry === 'object') assertSafeConfiguration(entry);
  }
}
