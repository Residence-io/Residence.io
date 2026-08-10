import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { getCurrentUser } from '@/lib/api.server';

const adminRoles = [
  'SUPER_ADMINISTRATOR',
  'ADMINISTRATOR',
  'ACCOUNTS_MANAGER',
  'MAINTENANCE_MANAGER',
];
const baseNavigation = [
  { label: 'Dashboard', href: '/admin/dashboard', available: true },
  { label: 'Residents', href: '/admin/residents', available: true },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Staff and Workers', href: '/admin/staff' },
  { label: 'Complaints and Maintenance', href: '/admin/maintenance' },
  { label: 'Notifications', href: '/admin/notifications' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Settings', href: '/admin/settings' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.forcePasswordChange) redirect('/change-password');
  if (!user.roles.some((role: any) => adminRoles.includes(role)))
    redirect('/unauthorized');
  const navigation = baseNavigation.map((item) =>
    item.label === 'Payments'
      ? {
          ...item,
          available: user.permissions.includes('BILLING_DUE_READ'),
        }
      : item.label === 'Staff and Workers'
        ? {
            ...item,
            available: user.permissions.some((permission: any) =>
              ['STAFF_MANAGE', 'WORKER_MANAGE', 'SALARY_READ'].includes(
                permission,
              ),
            ),
          }
        : item.label === 'Complaints and Maintenance'
          ? {
              ...item,
              available: user.permissions.some((permission: any) =>
                [
                  'COMPLAINT_READ',
                  'COMPLAINT_MANAGE',
                  'MAINTENANCE_READ',
                  'MAINTENANCE_MANAGE',
                ].includes(permission),
              ),
            }
          : item.label === 'Notifications'
            ? {
                ...item,
                available: user.permissions.some((permission: any) =>
                  [
                    'NOTIFICATION_SEND',
                    'NOTIFICATION_LOG_READ',
                    'ANNOUNCEMENT_MANAGE',
                  ].includes(permission),
                ),
              }
            : item.label === 'Reports'
              ? { ...item, available: user.permissions.includes('REPORT_READ') }
              : item.label === 'Settings'
                ? {
                    ...item,
                    available: user.permissions.includes(
                      'SOCIETY_SETTING_MANAGE',
                    ),
                  }
                : item,
  );
  return (
    <AppShell user={user} portal="Administration" navigation={navigation}>
      {children}
    </AppShell>
  );
}
