import { ChartEmpty, type ChartDatum } from './dashboard-ui';

const palette = [
  '#2563eb',
  '#0f766e',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#475569',
];

export function TrendChart({
  data,
  title,
  formatValue = (value) => String(value),
}: {
  data: ChartDatum[];
  title: string;
  formatValue?: (value: number) => string;
}) {
  if (!data.some((item) => item.value > 0))
    return <ChartEmpty message="No activity in this reporting period." />;
  const width = 640;
  const height = 220;
  const padding = 28;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (item.value / max) * (height - padding * 2);
    return { ...item, x, y };
  });
  const pointString = points.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <div data-testid="trend-chart">
      <svg
        className="h-auto w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <desc>
          {data
            .map((item) => `${item.label}: ${formatValue(item.value)}`)
            .join(', ')}
        </desc>
        {[0, 0.5, 1].map((step) => {
          const y = padding + step * (height - padding * 2);
          return (
            <line
              key={step}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 6"
            />
          );
        })}
        <polyline
          fill="none"
          points={pointString}
          stroke="#2563eb"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {points.map((point) => (
          <circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            fill="#ffffff"
            r="5"
            stroke="#2563eb"
            strokeWidth="3"
          >
            <title>
              {point.label}: {formatValue(point.value)}
            </title>
          </circle>
        ))}
      </svg>
      <div
        className="mt-2 grid gap-1 text-center text-[11px] font-medium text-slate-500"
        style={{
          gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {data.map((item) => (
          <span key={item.label} className="truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  title,
  formatValue = (value) => String(value),
}: {
  data: ChartDatum[];
  title: string;
  formatValue?: (value: number) => string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <ChartEmpty message="No values are available yet." />;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((item, index) => {
    const preceding = data
      .slice(0, index)
      .reduce((sum, entry) => sum + entry.value, 0);
    return {
      ...item,
      length: (item.value / total) * circumference,
      offset: -(preceding / total) * circumference,
    };
  });

  return (
    <div
      className="grid gap-5 sm:grid-cols-[160px_1fr] sm:items-center"
      data-testid="donut-chart"
    >
      <svg
        className="mx-auto size-40"
        viewBox="0 0 128 128"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <circle
          cx="64"
          cy="64"
          fill="none"
          r={radius}
          stroke="#e2e8f0"
          strokeWidth="16"
        />
        {segments.map((item, index) => {
          return (
            <circle
              key={item.label}
              cx="64"
              cy="64"
              fill="none"
              r={radius}
              stroke={palette[index % palette.length]}
              strokeDasharray={`${item.length} ${circumference - item.length}`}
              strokeDashoffset={item.offset}
              strokeWidth="16"
              transform="rotate(-90 64 64)"
            >
              <title>
                {item.label}: {formatValue(item.value)}
              </title>
            </circle>
          );
        })}
        <text
          x="64"
          y="60"
          textAnchor="middle"
          className="fill-slate-500 text-[10px] font-semibold uppercase"
        >
          Total
        </text>
        <text
          x="64"
          y="76"
          textAnchor="middle"
          className="fill-slate-950 text-sm font-bold"
        >
          {formatValue(total)}
        </text>
      </svg>
      <ul className="space-y-3 text-sm">
        {data.map((item, index) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: palette[index % palette.length] }}
              />
              <span className="truncate capitalize">
                {item.label.toLowerCase()}
              </span>
            </span>
            <span className="font-bold text-slate-900">
              {formatValue(item.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HorizontalBarChart({
  data,
  title,
  formatValue = (value) => String(value),
}: {
  data: ChartDatum[];
  title: string;
  formatValue?: (value: number) => string;
}) {
  if (!data.some((item) => item.value > 0))
    return <ChartEmpty message="No records are available for this view." />;
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div
      className="space-y-4"
      role="img"
      aria-label={title}
      data-testid="bar-chart"
    >
      {data.map((item, index) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium capitalize text-slate-600">
              {item.label.toLowerCase()}
            </span>
            <span className="font-bold text-slate-900">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: palette[index % palette.length],
                width: `${Math.max((item.value / max) * 100, item.value ? 3 : 0)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComparisonBars({
  data,
  title,
  firstLabel,
  secondLabel,
  firstKey,
  secondKey,
  formatValue,
}: {
  data: ({ label: string } & Record<string, string | number>)[];
  title: string;
  firstLabel: string;
  secondLabel: string;
  firstKey: string;
  secondKey: string;
  formatValue: (value: number) => string;
}) {
  const max = Math.max(
    ...data.flatMap((item) => [
      Number(item[firstKey] ?? 0),
      Number(item[secondKey] ?? 0),
    ]),
    1,
  );
  if (
    !data.some(
      (item) =>
        Number(item[firstKey] ?? 0) > 0 || Number(item[secondKey] ?? 0) > 0,
    )
  )
    return (
      <ChartEmpty message="No dues or payments in this reporting period." />
    );

  return (
    <div role="img" aria-label={title} data-testid="comparison-chart">
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-slate-400" aria-hidden />
          {firstLabel}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-blue-600" aria-hidden />
          {secondLabel}
        </span>
      </div>
      <div className="space-y-4">
        {data.map((item) => {
          const first = Number(item[firstKey] ?? 0);
          const second = Number(item[secondKey] ?? 0);
          return (
            <div
              key={item.label}
              className="grid grid-cols-[3.5rem_1fr] items-center gap-3"
            >
              <span className="text-xs font-semibold text-slate-500">
                {item.label}
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{ width: `${(first / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-[11px] text-slate-500">
                    {formatValue(first)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-50">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${(second / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-[11px] font-semibold text-slate-700">
                    {formatValue(second)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
