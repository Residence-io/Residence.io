import { redirect } from 'next/navigation';
import { AppShell, type NavigationItem } from '@/components/shell/app-shell';
import { getCurrentUser } from '@/lib/api.server';

const adminRoles = [
  'SUPER_ADMINISTRATOR',
  'ADMINISTRATOR',
  'ACCOUNTS_MANAGER',
  'MAINTENANCE_MANAGER',
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.forcePasswordChange) redirect('/change-password');
  if (!user.roles.some((role: string) => adminRoles.includes(role)))
    redirect('/unauthorized');

  const perms = user.permissions;
  const hasFinance = perms.includes('BILLING_DUE_READ');
  const hasWorkforce = perms.some((p: string) =>
    ['STAFF_MANAGE', 'WORKER_MANAGE', 'SALARY_READ'].includes(p),
  );
  const hasHelpdesk = perms.some((p: string) =>
    ['COMPLAINT_READ', 'COMPLAINT_MANAGE', 'MAINTENANCE_READ', 'MAINTENANCE_MANAGE'].includes(p),
  );
  const hasComms = perms.some((p: string) =>
    ['NOTIFICATION_SEND', 'NOTIFICATION_LOG_READ', 'ANNOUNCEMENT_MANAGE'].includes(p),
  );
  const hasReports = perms.includes('REPORT_READ');
  const hasSettings = perms.includes('SOCIETY_SETTING_MANAGE');

  const navigation: NavigationItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', available: true },
    {
      label: 'PEOPLE',
      children: [
        { label: 'Residents', href: '/admin/residents', available: true },
        { label: 'Properties', href: '/admin/properties', available: true },
      ],
    },
    {
      label: 'FINANCE',
      children: [
        { label: 'Finance', href: '/admin/payments', available: hasFinance },
      ],
    },
    {
      label: 'OPERATIONS',
      children: [
        { label: 'Helpdesk', href: '/admin/maintenance', available: hasHelpdesk },
        { label: 'Workforce', href: '/admin/staff', available: hasWorkforce },
      ],
    },
    {
      label: 'COMMUNICATION',
      children: [
        { label: 'Communications', href: '/admin/notifications', available: hasComms },
      ],
    },
    {
      label: 'INSIGHTS',
      children: [
        { label: 'Reports', href: '/admin/reports', available: hasReports },
      ],
    },
    {
      label: 'SYSTEM',
      children: [
        { label: 'Administration', href: '/admin/settings', available: hasSettings },
      ],
    },
  ];

  return (
    <AppShell user={user} portal="Administration" navigation={navigation}>
      {children}
    </AppShell>
  );
}
