import { fetchDashboard } from '@/lib/supabase-data.server';
import {
  Banknote,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  ClipboardList,
  FileBarChart,
  Home,
  Megaphone,
  MessageSquareWarning,
  UserPlus,
  Users,
  WalletCards,
  Wrench,
} from 'lucide-react';
import {
  DonutChart,
  HorizontalBarChart,
  TrendChart,
} from '@/components/dashboard/dashboard-charts';
import {
  DashboardHeader,
  KpiCard,
  QuickActions,
  SectionCard,
  type ChartDatum,
  type Period,
} from '@/components/dashboard/dashboard-ui';
import { getCurrentUser } from '@/lib/api.server';

type Dashboard = {
  context: {
    societyName: string;
    currency: string;
    timeZone: string;
    period: Period;
    from: string;
    to: string;
  };
  totalResidents: number;
  activeResidents: number;
  occupiedUnits: number;
  vacantUnits: number;
  paymentsReceived: string | null;
  outstandingDues: string | null;
  overdueDues: number | null;
  openComplaints: number | null;
  overdueComplaints: number | null;
  pendingMaintenance: number | null;
  availableWorkers: number;
  assignedWorkers: number;
  pendingSalary: string | null;
  unreadNotifications: number | null;
  failedDeliveries: number | null;
  charts: {
    paymentTrend: ChartDatum[];
    duesBreakdown: ChartDatum[];
    complaintStatus: ChartDatum[];
    occupancy: ChartDatum[];
    workerStatus: ChartDatum[];
    notificationDelivery: {
      channel: string;
      status: string;
      value: number;
    }[];
  };
};

function dashboardPeriod(value?: string): Period {
  return value === 'month' || value === '12m' ? value : '6m';
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const query = await searchParams;
  const period = dashboardPeriod(query.period);
  const [data, user] = await Promise.all([
    fetchDashboard(period),
    getCurrentUser(),
  ]);
  const permissions = new Set(user?.permissions ?? []);
  const canAny = (...required: string[]) =>
    required.some((permission) => permissions.has(permission));
  const actions = [
    {
      label: 'Add resident',
      description: 'Register a new household',
      href: '/admin/residents/new',
      icon: UserPlus,
      allowed: canAny('RESIDENT_CREATE'),
    },
    {
      label: 'Record payment',
      description: 'Post a resident payment',
      href: '/admin/payments',
      icon: WalletCards,
      allowed: canAny('PAYMENT_RECORD'),
    },
    {
      label: 'Announcement',
      description: 'Create society communication',
      href: '/admin/announcements/new',
      icon: Megaphone,
      allowed: canAny('ANNOUNCEMENT_MANAGE'),
    },
    {
      label: 'View complaints',
      description: 'Review open resident issues',
      href: '/admin/complaints',
      icon: MessageSquareWarning,
      allowed: canAny('COMPLAINT_READ', 'COMPLAINT_MANAGE'),
    },
    {
      label: 'Assign worker',
      description: 'Open unassigned maintenance',
      href: '/admin/maintenance/unassigned',
      icon: Wrench,
      allowed: canAny('WORKER_SCHEDULE', 'MAINTENANCE_MANAGE'),
    },
    {
      label: 'Open reports',
      description: 'Explore operational reports',
      href: '/admin/reports',
      icon: FileBarChart,
      allowed: canAny('REPORT_READ'),
    },
  ].filter(({ allowed }) => allowed);
  const currency = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: data.context.currency,
    maximumFractionDigits: 0,
  });
  const money = (value: number | string | null) =>
    value === null ? null : currency.format(Number(value));
  const periodLabel =
    period === 'month'
      ? 'Current month'
      : period === '12m'
        ? 'Last 12 months'
        : 'Last 6 months';
  const notificationBars = data.charts.notificationDelivery.map(
    (item: any) => ({
      label: `${item.channel} · ${item.status}`,
      value: item.value,
    }),
  );

  return (
    <div className="space-y-8">
      <DashboardHeader
        eyebrow="Administration"
        title="Society overview"
        description="A clear view of residents, collections, service delivery, and operational risks."
        societyName={data.context.societyName}
        period={data.context.period}
        from={data.context.from}
        to={data.context.to}
        basePath="/admin/dashboard"
      />

      <QuickActions actions={actions} />

      <section aria-labelledby="primary-kpis">
        <h2 id="primary-kpis" className="sr-only">
          Primary performance indicators
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total residents"
            value={data.totalResidents}
            detail={`${data.activeResidents} active`}
            icon={Users}
            tone="blue"
            primary
          />
          <KpiCard
            label="Payments received"
            value={money(data.paymentsReceived)}
            detail={periodLabel}
            icon={CircleDollarSign}
            tone="emerald"
            primary
          />
          <KpiCard
            label="Outstanding dues"
            value={money(data.outstandingDues)}
            detail={
              data.overdueDues === null
                ? 'Financial access restricted'
                : `${data.overdueDues} overdue dues`
            }
            icon={Banknote}
            tone="amber"
            primary
          />
          <KpiCard
            label="Open complaints"
            value={data.openComplaints}
            detail={
              data.overdueComplaints === null
                ? 'Ticket access restricted'
                : `${data.overdueComplaints} overdue`
            }
            icon={MessageSquareWarning}
            tone="rose"
            primary
          />
        </div>
      </section>

      <section aria-labelledby="operational-kpis">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2
              id="operational-kpis"
              className="text-lg font-bold text-slate-950"
            >
              Operational pulse
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Current capacity, workload, and delivery exceptions.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Occupied properties"
            value={data.occupiedUnits}
            detail={`${data.vacantUnits} vacant`}
            icon={Home}
            tone="slate"
          />
          <KpiCard
            label="Pending maintenance"
            value={data.pendingMaintenance}
            detail={`${data.assignedWorkers} workers busy`}
            icon={Wrench}
            tone="amber"
          />
          <KpiCard
            label="Available workers"
            value={data.availableWorkers}
            detail="Ready for assignment"
            icon={BriefcaseBusiness}
            tone="emerald"
          />
          <KpiCard
            label="Pending salaries"
            value={money(data.pendingSalary)}
            detail="Current unpaid balance"
            icon={ClipboardList}
            tone="slate"
          />
          <KpiCard
            label="Unread notifications"
            value={data.unreadNotifications}
            detail="Across in-app recipients"
            icon={BellRing}
            tone="blue"
          />
          <KpiCard
            label="Failed deliveries"
            value={data.failedDeliveries}
            detail="Requires delivery review"
            icon={BellRing}
            tone="rose"
          />
          <KpiCard
            label="Active residents"
            value={data.activeResidents}
            detail={`${data.totalResidents} total`}
            icon={Users}
            tone="blue"
          />
          <KpiCard
            label="Vacant properties"
            value={data.vacantUnits}
            detail="Available inventory"
            icon={Building2}
            tone="slate"
          />
        </div>
      </section>

      <section aria-labelledby="dashboard-insights">
        <div className="mb-4">
          <h2
            id="dashboard-insights"
            className="text-xl font-bold text-slate-950"
          >
            Operational insights
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Authorized, society-scoped trends for {periodLabel.toLowerCase()}.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            className="lg:col-span-2"
            title="Payment collection trend"
            description="Confirmed resident payments grouped by month."
          >
            <TrendChart
              data={data.charts.paymentTrend}
              title="Payment collection trend"
              formatValue={(value) => currency.format(value)}
            />
          </SectionCard>
          <SectionCard
            title="Dues position"
            description="Paid, outstanding, and waived dues in the selected period."
          >
            <DonutChart
              data={data.charts.duesBreakdown}
              title="Dues position"
              formatValue={(value) => currency.format(value)}
            />
          </SectionCard>
          <SectionCard
            title="Property utilization"
            description="Current occupied and vacant unit distribution."
          >
            <DonutChart
              data={data.charts.occupancy}
              title="Occupied versus vacant properties"
            />
          </SectionCard>
          <SectionCard
            title="Complaints by status"
            description="Complaints created during the selected reporting period."
          >
            <HorizontalBarChart
              data={data.charts.complaintStatus}
              title="Complaints by status"
            />
          </SectionCard>
          <SectionCard
            title="Worker availability"
            description="Current service-worker capacity by operational status."
          >
            <HorizontalBarChart
              data={data.charts.workerStatus}
              title="Workers by availability status"
            />
          </SectionCard>
          <SectionCard
            className="lg:col-span-2"
            title="Notification delivery"
            description="Channel and delivery-status distribution for the selected period."
          >
            <HorizontalBarChart
              data={notificationBars}
              title="Notification delivery status by channel"
            />
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
