export const DASHBOARD_PERIOD_MONTHS = {
  month: 1,
  '6m': 6,
  '12m': 12,
} as const;

export type DashboardPeriod = keyof typeof DASHBOARD_PERIOD_MONTHS;

export function dashboardWindow(period: DashboardPeriod, now = new Date()) {
  const months = DASHBOARD_PERIOD_MONTHS[period];
  const end = new Date(now);
  const start = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1, 1),
  );
  const labels = Array.from({ length: months }, (_, index) => {
    const date = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
    );
    return {
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('en', {
        month: 'short',
        year: months > 6 ? '2-digit' : undefined,
        timeZone: 'UTC',
      }),
    };
  });
  return { start, end, labels };
}

export function monthlySeries(
  labels: { key: string; label: string }[],
  rows: { month: Date | string; value: unknown }[],
) {
  const values = new Map(
    rows.map((row) => [
      new Date(row.month).toISOString().slice(0, 7),
      Number(row.value ?? 0),
    ]),
  );
  return labels.map(({ key, label }) => ({
    key,
    label,
    value: values.get(key) ?? 0,
  }));
}
