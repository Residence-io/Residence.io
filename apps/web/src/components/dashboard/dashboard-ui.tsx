import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleAlert,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export type Period = 'month' | '6m' | '12m';

export type ChartDatum = {
  label: string;
  value: number;
};

export function DashboardHeader({
  eyebrow,
  title,
  description,
  societyName,
  period,
  from,
  to,
  basePath,
}: {
  eyebrow: string;
  title: string;
  description: string;
  societyName: string;
  period: Period;
  from: string;
  to: string;
  basePath: string;
}) {
  const periods: { value: Period; label: string }[] = [
    { value: 'month', label: 'This month' },
    { value: '6m', label: '6 months' },
    { value: '12m', label: '12 months' },
  ];
  const range = `${new Date(from).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} – ${new Date(to).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;

  return (
    <header
      className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between"
      data-testid="dashboard-header"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{societyName}</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden size={15} />
            {range}
          </span>
        </div>
      </div>
      <nav
        aria-label="Dashboard reporting period"
        className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      >
        {periods.map((option) => (
          <Link
            key={option.value}
            href={`${basePath}?period=${option.value}`}
            aria-current={period === option.value ? 'page' : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              period === option.value
                ? 'bg-slate-950 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            {option.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function QuickActions({
  actions,
}: {
  actions: {
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
  }[];
}) {
  return (
    <section
      aria-labelledby="quick-actions-title"
      data-testid="dashboard-quick-actions"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="quick-actions-title"
          className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600"
        >
          Quick actions
        </h2>
        <span className="text-xs text-slate-500">
          {actions.length} available
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-24 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-100">
                <Icon aria-hidden size={18} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                  {action.label}
                  <ArrowUpRight
                    aria-hidden
                    className="text-slate-400"
                    size={14}
                  />
                </span>
                <span className="mt-1 block text-xs leading-4 text-slate-500">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  primary = false,
  tone = 'blue',
}: {
  label: string;
  value: string | number | null;
  detail?: string;
  icon: LucideIcon;
  primary?: boolean;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <Card
      className={`relative overflow-hidden p-5 shadow-none ${primary ? 'sm:col-span-2 lg:col-span-1' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">
            {value ?? 'Restricted'}
          </p>
          {detail ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
          ) : null}
        </div>
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}
        >
          <Icon aria-hidden size={19} />
        </span>
      </div>
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 shadow-none sm:p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
      <div>
        <CircleAlert aria-hidden className="mx-auto text-slate-400" size={24} />
        <p className="mt-3 text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export function DashboardFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {children}
      <ChevronRight aria-hidden size={16} />
    </Link>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-7" aria-label="Loading dashboard" role="status">
      <div className="h-32 rounded-xl bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-24 rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-xl bg-slate-200" />
        ))}
      </div>
      <span className="sr-only">Dashboard data is loading.</span>
    </div>
  );
}

export function DashboardErrorMessage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <CircleAlert aria-hidden className="mx-auto text-red-600" size={30} />
      <h1 className="mt-4 text-xl font-bold text-slate-950">
        Dashboard could not be loaded
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        The data service did not respond as expected. Your records were not
        changed.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Try again
      </button>
    </div>
  );
}
