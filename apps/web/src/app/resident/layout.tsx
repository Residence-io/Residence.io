import { redirect } from 'next/navigation';
import { AppShell, type NavigationItem } from '@/components/shell/app-shell';
import { getCurrentUser } from '@/lib/api.server';

const navigation: NavigationItem[] = [
  { label: 'Home', href: '/resident/dashboard', available: true },
  { label: 'Payments', href: '/resident/payments', available: true },
  { label: 'Services', href: '/resident/services', available: true },
  { label: 'Visitors', href: '/resident/visitors', available: true },
  { label: 'Notifications', href: '/resident/notifications', available: true },
  { label: 'My Profile', href: '/resident/profile', available: true },
];

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.forcePasswordChange) redirect('/change-password');
  if (!user.roles.includes('RESIDENT')) redirect('/unauthorized');

  return (
    <AppShell user={user} portal="Resident" navigation={navigation}>
      {children}
    </AppShell>
  );
}
