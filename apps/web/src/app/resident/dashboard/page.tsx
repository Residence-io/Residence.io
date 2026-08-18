import {
  Bell,
  CircleDollarSign,
  CreditCard,
  FileText,
  MessageSquarePlus,
  ReceiptText,
  UserRound,
  WalletCards,
  Wrench,
} from 'lucide-react';
import {
  ComparisonBars,
  DonutChart,
  HorizontalBarChart,
  TrendChart,
} from '@/components/dashboard/dashboard-charts';
import {
  DashboardFooterLink,
  DashboardHeader,
  KpiCard,
  QuickActions,
  SectionCard,
  type ChartDatum,
  type Period,
} from '@/components/dashboard/dashboard-ui';
import { serverApi } from '@/lib/api.server';

type Dashboard = {
  context: {
    societyName: string;
    residentName: string;
    currency: string;
    timeZone: string;
    period: Period;
    from: string;
    to: string;
  };
  totalPaid: string;
  outstandingBalance: string;
  currentDue?: {
    totalAmount: string;
    outstandingAmount: string;
    dueDate: string;
  };
  advanceCredit: string;
  latestReceipt?: { id: string; receiptNumber: string; issuedAt: string };
  openComplaints: number;
  openMaintenance: number;
  unreadNotifications: number;
  charts: {
    paymentTrend: ChartDatum[];
    duesVsPayments: {
      key: string;
      label: string;
      due: number;
      paid: number;
    }[];
    financialBreakdown: ChartDatum[];
    complaintStatus: ChartDatum[];
    maintenanceStatus: ChartDatum[];
  };
};

function dashboardPeriod(value?: string): Period {
  return value === 'month' || value === '12m' ? value : '6m';
}

export default async function ResidentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const query = await searchParams;
  const period = dashboardPeriod(query.period);
  const data = await serverApi<Dashboard>(`/reports/dashboard/me?period=${period}`);
  const currency = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: data.context.currency,
    maximumFractionDigits: 0,
  });
  const firstName = data.context.residentName.trim().split(/\s+/)[0];
  const periodLabel =
    period === 'month'
      ? 'this month'
      : period === '12m'
        ? 'the last 12 months'
        : 'the last 6 months';
  const ticketStatus = [
    ...data.charts.complaintStatus.map((item) => ({
      ...item,
      label: `Complaint · ${item.label}`,
    })),
    ...data.charts.maintenanceStatus.map((item) => ({
      ...item,
      label: `Maintenance · ${item.label}`,
    })),
  ];
  const actions = [
    {
      label: 'Pay now',
      description: 'Submit a society payment',
      href: '/resident/payments/pay',
      icon: CreditCard,
    },
    {
      label: 'View payments',
      description: 'Open payment history',
      href: '/resident/payments',
      icon: WalletCards,
    },
    {
      label: 'Maintenance',
      description: 'Request a service visit',
      href: '/resident/maintenance/new',
      icon: Wrench,
    },
    {
      label: 'Complaint',
      description: 'Submit a society issue',
      href: '/resident/complaints/new',
      icon: MessageSquarePlus,
    },
    {
      label: 'Notifications',
      description: 'Review your updates',
      href: '/resident/notifications',
      icon: Bell,
    },
    {
      label: 'My profile',
      description: 'View account information',
      href: '/resident/profile',
      icon: UserRound,
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardHeader
        eyebrow={`Welcome back, ${firstName}`}
        title="Your residence overview"
        description="Private financial and service information calculated only from your authorized resident record."
        societyName={data.context.societyName}
        period={data.context.period}
        from={data.context.from}
        to={data.context.to}
        basePath="/resident/dashboard"
      />

      <QuickActions actions={actions} />

      <section aria-labelledby="resident-financial-summary">
        <h2 id="resident-financial-summary" className="sr-only">
          Financial summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Current monthly due"
            value={currency.format(
              Number(data.currentDue?.outstandingAmount ?? 0),
            )}
            detail={
              data.currentDue
                ? `Due ${new Date(data.currentDue.dueDate).toLocaleDateString()}`
                : 'No current due'
            }
            icon={FileText}
            tone="amber"
            primary
          />
          <KpiCard
            label="Outstanding balance"
            value={currency.format(Number(data.outstandingBalance))}
            detail="All unsettled dues"
            icon={CircleDollarSign}
            tone="rose"
            primary
          />
          <KpiCard
            label="Amount paid"
            value={currency.format(Number(data.totalPaid))}
            detail={`Paid during ${periodLabel}`}
            icon={WalletCards}
            tone="emerald"
            primary
          />
          <KpiCard
            label="Advance credit"
            value={currency.format(Number(data.advanceCredit))}
            detail="Available resident credit"
            icon={CreditCard}
            tone="blue"
            primary
          />
        </div>
      </section>

      <section aria-labelledby="resident-service-summary">
        <div className="mb-3">
          <h2
            id="resident-service-summary"
            className="text-lg font-bold text-slate-950"
          >
            Service status
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current requests and unread communication.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard
            label="Open complaints"
            value={data.openComplaints}
            detail="Awaiting closure"
            icon={MessageSquarePlus}
            tone="amber"
          />
          <KpiCard
            label="Active maintenance"
            value={data.openMaintenance}
            detail="Current service requests"
            icon={Wrench}
            tone="blue"
          />
          <KpiCard
            label="Unread notifications"
            value={data.unreadNotifications}
            detail="Updates waiting for you"
            icon={Bell}
            tone="rose"
          />
        </div>
      </section>

      <section aria-labelledby="resident-insights">
        <div className="mb-4">
          <h2
            id="resident-insights"
            className="text-xl font-bold text-slate-950"
          >
            Your financial insights
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Payment and dues history for {periodLabel}.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            className="lg:col-span-2"
            title="Monthly payment history"
            description="Your confirmed payments grouped by month."
          >
            <TrendChart
              data={data.charts.paymentTrend}
              title="Resident monthly payment history"
              formatValue={(value) => currency.format(value)}
            />
          </SectionCard>
          <SectionCard
            title="Paid versus outstanding"
            description="Paid during the selected period compared with your current balance."
          >
            <DonutChart
              data={data.charts.financialBreakdown}
              title="Paid amount versus outstanding balance"
              formatValue={(value) => currency.format(value)}
            />
          </SectionCard>
          <SectionCard
            title="Dues and payments"
            description="Monthly dues compared with amounts allocated as paid."
          >
            <ComparisonBars
              data={data.charts.duesVsPayments}
              title="Monthly dues versus payments"
              firstLabel="Due"
              secondLabel="Paid"
              firstKey="due"
              secondKey="paid"
              formatValue={(value) => currency.format(value)}
            />
          </SectionCard>
          <SectionCard
            className="lg:col-span-2"
            title="Requests by status"
            description="Status summary for only your complaints and maintenance requests."
          >
            <HorizontalBarChart
              data={ticketStatus}
              title="Resident complaints and maintenance requests by status"
            />
          </SectionCard>
        </div>
      </section>

      <SectionCard
        title="Latest receipt"
        description="Your most recently issued payment receipt."
      >
        {data.latestReceipt ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <ReceiptText aria-hidden size={21} />
              </span>
              <div>
                <p className="font-bold text-slate-950">
                  {data.latestReceipt.receiptNumber}
                </p>
                <p className="text-sm text-slate-500">
                  Issued{' '}
                  {new Date(data.latestReceipt.issuedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <DashboardFooterLink
              href={`/resident/payments/receipts/${data.latestReceipt.id}`}
            >
              View receipt
            </DashboardFooterLink>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No receipt has been issued yet.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
