const REDACTED_KEY =
  /(secret|password|token|identity|bank|credential|private.?key)/i;

export function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      REDACTED_KEY.test(key) ? '[REDACTED]' : redactAuditValue(entry),
    ]),
  );
}

export function csvCell(value: unknown): string {
  const text =
    value == null
      ? ''
      : typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          typeof value === 'bigint'
        ? String(value)
        : JSON.stringify(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function canAssignRoles(
  actorRoles: string[],
  desiredRoles: string[],
): boolean {
  return (
    actorRoles.includes('SUPER_ADMINISTRATOR') ||
    !desiredRoles.includes('SUPER_ADMINISTRATOR')
  );
}

export function removingLastSuperAdministrator(
  activeSuperAdministratorCount: number,
  targetHasSuperRole: boolean,
  keepsSuperRoleAndActive: boolean,
): boolean {
  return (
    targetHasSuperRole &&
    !keepsSuperRoleAndActive &&
    activeSuperAdministratorCount <= 1
  );
}
