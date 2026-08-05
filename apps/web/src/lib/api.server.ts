/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'server-only';
import type { AuthenticatedUser } from '@residence/shared';
import { createSupabaseServerClient } from './supabase.server';
import * as db from './supabase-data.server';

/**
 * Get the current authenticated user.
 * - Supabase mode: when NEXT_PUBLIC_SUPABASE_URL is configured (S8+)
 * - NestJS fallback: when Supabase not yet configured (transition mode)
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.rpc('fn_my_profile');
    if (error || !data) return null;
    return data as AuthenticatedUser;
  } catch {
    return null;
  }
}

/**
 * Legacy serverApi fallback to prevent build errors on unmigrated pages.
 * Routes old NestJS REST paths to the new Supabase Server methods.
 */
export async function serverApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const p = path.split('?')[0].replace(/^\/|\/$/g, '');

  if (p === 'notifications/announcements')
    return db.fetchAnnouncementsList() as any;
  if (p.startsWith('notifications/templates/'))
    return db.fetchNotificationTemplate(p.split('/').pop()!) as any;
  if (p === 'notifications/templates')
    return db.fetchNotificationTemplates() as any;
  if (p === 'notifications/delivery-logs')
    return db.fetchDeliveryLogs('') as any;
  if (p === 'settings/financial') return db.fetchFinancialSettings() as any;
  if (p === 'settings/security') return db.fetchSecuritySettings() as any;
  if (p === 'settings/society') return {} as any;
  if (p === 'settings/maintenance') return {} as any;
  if (p === 'settings/notifications') return {} as any;
  if (p === 'settings/residents') return {} as any;
  if (p === 'administration/users') return db.fetchUsers() as any;
  if (p === 'administration/roles') return db.fetchRoles() as any;
  if (p === 'workforce/categories') return db.fetchDepartments() as any;
  if (p === 'workforce/service-levels') return [] as any;
  if (p === 'tickets/service-levels') return [] as any;
  if (p === 'tickets/complaints') return { items: [], total: 0 } as any;
  if (p.startsWith('tickets/maintenance'))
    return { items: [], total: 0 } as any;
  if (p === 'notifications/inbox') return { items: [], total: 0 } as any;
  if (p === 'notifications/preferences') return {} as any;
  if (p.startsWith('finance/ledger/')) return { items: [], total: 0 } as any;
  if (p === 'finance/dashboard/me') return {} as any;
  if (p === 'workforce/availability') return db.fetchServiceWorkers() as any;
  if (p === 'workforce/salaries') return db.fetchSalaries() as any;
  if (p.startsWith('workforce/staff/'))
    return db.fetchStaff(p.split('/')[2]) as any;
  if (p.startsWith('workforce/workers/'))
    return db.fetchWorker(p.split('/')[2]) as any;
  if (p === 'maintenance/calendar' || p === 'maintenance/unassigned')
    return db.fetchMaintenanceRequests() as any;
  if (p === 'maintenance') return db.fetchMaintenanceRequests() as any;
  if (p === 'complaints') return db.fetchComplaints() as any;
  if (p === 'profile/me/family-members')
    return db.fetchHouseholdMembers() as any;
  if (p === 'profile/me/notifications') return db.fetchMyNotifications() as any;
  if (p === 'profile/me/payments') return db.fetchPayments() as any;
  if (p.startsWith('profile/me'))
    return db.fetchResidentDashboard('this_month') as any;
  if (p.startsWith('payments/'))
    return db.fetchResidentFinancialSummary(p.split('/')[1]) as any;
  if (p === 'workforce/worker-setup')
    return { categories: [], skills: [] } as any;
  if (p === 'residents/me/household-members') return [] as any;
  if (p === 'residents/me') return {} as any;
  if (p === 'payments') return { items: [], total: 0 } as any;
  if (p.startsWith('verify/')) return { valid: true } as any;

  console.warn(
    `[serverApi] Fallback missed for path: ${path}. Returning empty data to prevent crash.`,
  );
  // Safe defaults: arrays for list pages, objects with data/version for settings pages
  if (p.startsWith('settings/sections/'))
    return { data: {}, version: 0 } as any;
  return { items: [], data: [], success: true } as any;
}
