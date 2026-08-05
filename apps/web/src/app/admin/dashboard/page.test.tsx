import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import AdminDashboard from './page';

vi.mock('@/lib/api.server', () => ({
  getCurrentUser: vi.fn(),
  serverApi: vi.fn(),
}));

const dashboard = {
  context: {
    societyName: 'Demo Society',
    currency: 'PKR',
    timeZone: 'Asia/Karachi',
    period: '6m',
    from: '2026-02-01T00:00:00.000Z',
    to: '2026-07-28T00:00:00.000Z',
  },
  totalResidents: 42,
  activeResidents: 39,
  occupiedUnits: 30,
  vacantUnits: 8,
  paymentsReceived: '125000',
  outstandingDues: '25000',
  overdueDues: 3,
  openComplaints: 4,
  overdueComplaints: 1,
  pendingMaintenance: 2,
  availableWorkers: 5,
  assignedWorkers: 3,
  pendingSalary: '15000',
  unreadNotifications: 7,
  failedDeliveries: 1,
  charts: {
    paymentTrend: [
      { label: 'Jun', value: 50000 },
      { label: 'Jul', value: 75000 },
    ],
    duesBreakdown: [
      { label: 'Paid', value: 125000 },
      { label: 'Outstanding', value: 25000 },
    ],
    complaintStatus: [{ label: 'SUBMITTED', value: 4 }],
    occupancy: [
      { label: 'Occupied', value: 30 },
      { label: 'Vacant', value: 8 },
    ],
    workerStatus: [{ label: 'AVAILABLE', value: 5 }],
    notificationDelivery: [{ channel: 'EMAIL', status: 'FAILED', value: 1 }],
  },
} as const;

describe('Admin dashboard', () => {
  beforeEach(() => {
    vi.mocked(serverApi).mockResolvedValue(dashboard);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'admin',
      societyId: 'society',
      username: 'admin',
      displayName: 'Admin',
      forcePasswordChange: false,
      roles: ['ADMINISTRATOR'],
      permissions: ['REPORT_READ'],
      csrfToken: 'csrf',
    });
  });

  it('places authorized quick actions directly after the header and removes recent activity', async () => {
    render(
      await AdminDashboard({
        searchParams: Promise.resolve({ period: '6m' }),
      }),
    );

    const header = screen.getByTestId('dashboard-header');
    const actions = screen.getByTestId('dashboard-quick-actions');
    expect(header.nextElementSibling).toBe(actions);
    expect(screen.getByRole('link', { name: /Open reports/i })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: /Add resident/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Recent activity/i)).not.toBeInTheDocument();
  });

  it('renders authorized formatted data and forwards the selected period', async () => {
    render(
      await AdminDashboard({
        searchParams: Promise.resolve({ period: '12m' }),
      }),
    );

    expect(serverApi).toHaveBeenCalledWith(
      '/reports/dashboard/admin?period=12m',
    );
    expect(screen.getAllByText(/125,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('donut-chart')).toHaveLength(2);
    expect(screen.getByTestId('trend-chart')).toBeVisible();
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(3);
  });
});
