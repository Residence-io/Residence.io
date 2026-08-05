import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { serverApi } from '@/lib/api.server';
import ResidentDashboard from './page';

vi.mock('@/lib/api.server', () => ({ serverApi: vi.fn() }));

const dashboard = {
  context: {
    societyName: 'Demo Society',
    residentName: 'Development Resident',
    currency: 'PKR',
    timeZone: 'Asia/Karachi',
    period: '6m',
    from: '2026-02-01T00:00:00.000Z',
    to: '2026-07-28T00:00:00.000Z',
  },
  totalPaid: '75000',
  outstandingBalance: '25000',
  currentDue: {
    totalAmount: '10000',
    outstandingAmount: '5000',
    dueDate: '2026-07-31T00:00:00.000Z',
  },
  advanceCredit: '2000',
  latestReceipt: {
    id: 'receipt-1',
    receiptNumber: 'RCP-001',
    issuedAt: '2026-07-20T00:00:00.000Z',
  },
  openComplaints: 1,
  openMaintenance: 2,
  unreadNotifications: 3,
  charts: {
    paymentTrend: [
      { label: 'Jun', value: 25000 },
      { label: 'Jul', value: 50000 },
    ],
    duesVsPayments: [
      { key: '2026-06', label: 'Jun', due: 30000, paid: 25000 },
      { key: '2026-07', label: 'Jul', due: 50000, paid: 50000 },
    ],
    financialBreakdown: [
      { label: 'Paid in period', value: 75000 },
      { label: 'Outstanding', value: 25000 },
    ],
    complaintStatus: [{ label: 'SUBMITTED', value: 1 }],
    maintenanceStatus: [{ label: 'ASSIGNED', value: 2 }],
  },
} as const;

describe('Resident dashboard', () => {
  beforeEach(() => {
    vi.mocked(serverApi).mockResolvedValue(dashboard);
  });

  it('places quick actions directly after the header and removes the recent-payment list', async () => {
    render(
      await ResidentDashboard({
        searchParams: Promise.resolve({ period: '6m' }),
      }),
    );

    const header = screen.getByTestId('dashboard-header');
    const actions = screen.getByTestId('dashboard-quick-actions');
    expect(header.nextElementSibling).toBe(actions);
    expect(screen.getByRole('link', { name: /View payments/i })).toBeVisible();
    expect(screen.queryByText(/Recent payments/i)).not.toBeInTheDocument();
  });

  it('renders resident-owned charts and forwards the selected period', async () => {
    render(
      await ResidentDashboard({
        searchParams: Promise.resolve({ period: 'month' }),
      }),
    );

    expect(serverApi).toHaveBeenCalledWith(
      '/reports/dashboard/me?period=month',
    );
    expect(screen.getByText(/Welcome back, Development/i)).toBeVisible();
    expect(screen.getByTestId('trend-chart')).toBeVisible();
    expect(screen.getByTestId('comparison-chart')).toBeVisible();
    expect(screen.getByTestId('donut-chart')).toBeVisible();
    expect(screen.getByTestId('bar-chart')).toBeVisible();
  });
});
