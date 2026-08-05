import type { LoggerService } from '@nestjs/common';

const sensitiveKey =
  /(authorization|cookie|password|secret|token|identity|bank|private.?key)/i;

export function redactLogValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactLogValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitiveKey.test(key) ? '[REDACTED]' : redactLogValue(entry),
      ]),
    );
  }
  return value;
}

export class SafeJsonLogger implements LoggerService {
  constructor(private readonly minimumLevel = 'log') {}

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  private write(
    level: string,
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    const priorities: Record<string, number> = {
      error: 0,
      warn: 1,
      log: 2,
      debug: 3,
      verbose: 4,
    };
    if ((priorities[level] ?? 2) > (priorities[this.minimumLevel] ?? 2)) return;
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context,
      message: redactLogValue(message),
      ...(trace ? { trace: trace.slice(0, 4_000) } : {}),
    });
    (level === 'error' ? process.stderr : process.stdout).write(`${entry}\n`);
  }
}
