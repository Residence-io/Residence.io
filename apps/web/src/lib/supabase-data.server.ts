/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'server-only';
import { createSupabaseServerClient } from './supabase.server';
import type {
  ApiResident,
  ApiProperty,
  ApiUnit,
  ApiResidentOccupancy,
  ApiHouseholdMember,
  ApiVehicle,
  ApiResidentIdCard,
} from '@residence/shared';

/**
 * Phase S8: Supabase Data API helpers for Next.js Server Components.
 * All queries go through the `api` schema views which enforce RLS.
 * Use these instead of the legacy serverApi() for data reads.
 */

async function getClient() {
  return createSupabaseServerClient();
}

// ─── Residents ────────────────────────────────────────────────────────────────

export async function fetchResidents(societyId?: string) {
  const supabase = await getClient();
  let query = supabase

    .from('resident')
    .select(
      '*, user:user_account(*), occupancies:resident_occupancy(*, unit:unit(*, property:property(*)))',
    );
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    residentNumber: row.resident_number,
    fullName: row.full_name,
    primaryPhone: row.primary_phone,
    status: row.status,
    user: row.user
      ? { username: row.user.username, status: row.user.status }
      : null,
    occupancies: (row.occupancies || []).map((occ: any) => ({
      occupancyType: occ.occupancy_type,
      startDate: occ.start_date,
      endDate: occ.end_date,
      unit: occ.unit
        ? {
            id: occ.unit.id,
            unitNumber: occ.unit.unit_number,
            property: occ.unit.property
              ? {
                  id: occ.unit.property.id,
                  block: occ.unit.property.block,
                  propertyNumber: occ.unit.property.property_number,
                  type: occ.unit.property.type,
                }
              : null,
          }
        : null,
    })),
  })) as any[];
}

export async function fetchResident(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('resident')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as ApiResident;
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function fetchProperties(societyId?: string) {
  const supabase = await getClient();
  let query = supabase

    .from('property')
    .select('*, units:unit(*, occupancies:resident_occupancy(*))');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    block: row.block,
    street: row.street,
    propertyNumber: row.property_number,
    type: row.type,
    units: (row.units || []).map((u: any) => ({
      id: u.id,
      unitNumber: u.unit_number,
      status: u.status,
      occupancies: (u.occupancies || []).map((occ: any) => ({
        residentId: occ.resident_id,
        occupancyType: occ.occupancy_type,
      })),
    })),
  })) as any[];
}

export async function fetchUnits(propertyId: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('units')
    .select('*')
    .eq('property_id', propertyId)
    .order('unit_number');
  if (error) throw new Error(error.message);
  return (data ?? []) as ApiUnit[];
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export async function fetchDues(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('dues').select('*');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchPayments(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('payment').select('*, resident:resident(*)');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    resident: row.resident
      ? {
          residentNumber: row.resident.resident_number,
          fullName: row.resident.full_name,
        }
      : null,
    status: row.status,
    method: row.method,
    currency: row.currency,
    amount: row.amount,
    paymentDate: row.payment_date,
    receipt: row.receipt ? { receiptNumber: row.receipt.receipt_number } : null,
  })) as any[];
}

export async function fetchFinanceDashboard(societyId?: string) {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc('fn_finance_dashboard', {
    p_society_id: societyId,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchFeePlans(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('fee_plans').select('*');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    scope: row.scope,
    currency: row.currency,
    monthlyBaseAmount: row.monthly_base_amount,
    effectiveFrom: row.effective_from,
  })) as any[];
}

export async function fetchReceipts(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('receipts').select('*');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchResidentFinancialSummary(residentId: string) {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc('fn_resident_financial_summary', {
    p_resident_id: residentId,
  });
  if (error) throw new Error(error.message);
  return data;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export async function fetchComplaints(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('complaints').select('*');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    ticketNumber: row.ticket_number,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    privacy: row.privacy,
    description: row.description,
  })) as any[];
}

export async function fetchMaintenanceRequests(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('maintenance_requests').select('*');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    ticketNumber: row.ticket_number,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    privacy: row.privacy,
    description: row.description,
  })) as any[];
}

export async function fetchTicketDashboard(societyId?: string) {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc('fn_ticket_dashboard', {
    p_society_id: societyId,
  });
  if (error) throw new Error(error.message);
  return data;
}

// ─── Workforce ────────────────────────────────────────────────────────────────

export async function fetchStaffMembers(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('staff_member').select('*');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    staffNumber: row.staff_number,
    fullName: row.full_name,
    primaryPhone: row.primary_phone,
    status: row.status,
    employments: [],
  })) as any[];
}

export async function fetchServiceWorkers(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('service_worker').select('*');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    workerNumber: row.worker_number,
    fullName: row.full_name,
    primaryPhone: row.primary_phone,
    serviceArea: row.service_area,
    status: row.status,
    primaryCategory: row.primaryCategory
      ? { name: row.primaryCategory.name }
      : { name: 'Unknown' },
    skills: (row.skills || []).map((s: any) => ({
      skill: s.skill ? { name: s.skill.name } : { name: 'Unknown' },
    })),
  })) as any[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotificationDashboard(societyId?: string) {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc('fn_notification_dashboard', {
    p_society_id: societyId,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchMyNotifications() {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('my_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchAnnouncements(societyId?: string) {
  const supabase = await getClient();
  let query = supabase.from('announcements').select('*');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('publish_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Phase S8 Additional Helpers ──────────────────────────────────────────────

export async function fetchSalaries(societyId?: string) {
  const supabase = await getClient();
  let query = supabase

    .from('salary_records')
    .select('*, staff:staff_members(*), slips:salary_slips(*)');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    salaryPeriod: row.salary_period,
    currency: row.currency,
    netPayable: row.net_payable,
    amountPaid: row.amount_paid,
    status: row.status,
    staff: row.staff
      ? { fullName: row.staff.full_name }
      : { fullName: 'Unknown' },
    slips: (row.slips || []).map((slip: any) => ({
      id: slip.id,
      slipNumber: slip.slip_number,
    })),
  })) as any[];
}

export async function fetchDashboard(period: string, societyId?: string) {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc('fn_admin_dashboard', {
    p_period: period,
    p_society_id: societyId,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchResidentDashboard(period: string) {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc('fn_resident_dashboard', {
    p_period: period,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAuditLogs(societyId?: string) {
  const supabase = await getClient();
  let query = supabase

    .from('audit_logs')
    .select('*, actor:user_accounts(display_name, username)');
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    outcome: row.outcome,
    reason: row.reason,
    createdAt: row.created_at,
    actor: row.actor
      ? { displayName: row.actor.display_name, username: row.actor.username }
      : null,
    safeMetadata: row.safe_metadata,
  })) as any[];
}

export async function fetchRoles(societyId?: string) {
  const supabase = await getClient();
  let query = supabase

    .from('roles')
    .select(
      '*, permissions:role_permission(*, permission:permissions(*)), users:user_role(id)',
    );
  if (societyId) query = query.eq('society_id', societyId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    code: row.code,
    displayName: row.display_name,
    description: row.description,
    active: row.active,
    systemRole: row.system_role,
    version: row.version,
    permissions: (row.permissions || []).map((p: any) => ({
      permission: p.permission
        ? {
            id: p.permission.id,
            code: p.permission.code,
            description: p.permission.description,
          }
        : null,
    })),
    _count: { users: row.users ? row.users.length : 0 },
  })) as any[];
}

export async function fetchPermissions() {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('permissions')
    .select('*')
    .order('code');
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Automated Phase S8 Migration Helpers ─────────────────────────────────────

export async function fetchProperty(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchComplaintCategories() {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('ticket_categories')
    .select('*')
    .eq('type', 'complaint');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchComplaint(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('complaints')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchMaintenanceCategories() {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('ticket_categories')
    .select('*')
    .eq('type', 'maintenance');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchMaintenanceRequest(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('maintenance_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchDepartments() {
  const supabase = await getClient();
  const { data, error } = await supabase.from('departments').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchPayment(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('payments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchReport(reportName: string, query: string) {
  const supabase = await getClient();
  // Generic report RPC fallback
  const { data, error } = await supabase.rpc('fn_generate_report', {
    report_name: reportName,
    query_params: query,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchReportsList() {
  const supabase = await getClient();
  const { data, error } = await supabase.from('reports').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchNotificationTemplates() {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('notification_templates')
    .select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchNotificationTemplate(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('notification_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchNotificationBatch(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('notification_batches')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchDeliveryLogs(query: string) {
  const supabase = await getClient();
  const { data, error } = await supabase.from('delivery_logs').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchLedger(residentId: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('ledger')
    .select('*')
    .eq('resident_id', residentId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchMaintenanceRequestsByQuery(query: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('maintenance_requests')
    .select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchComplaintsByQuery(query: string) {
  const supabase = await getClient();
  const { data, error } = await supabase.from('complaints').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchAnnouncementsList() {
  const supabase = await getClient();
  const { data, error } = await supabase.from('announcements').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchAnnouncement(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchUsers() {
  const supabase = await getClient();
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchHouseholdMembers() {
  const supabase = await getClient();
  const { data, error } = await supabase.from('household_members').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchCorrectionRequests() {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('correction_requests')
    .select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchSecuritySettings() {
  const supabase = await getClient();
  const { data, error } = await supabase.from('security_settings').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchFinancialSettings() {
  const supabase = await getClient();
  const { data, error } = await supabase.from('financial_settings').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchWorkerSetup() {
  const supabase = await getClient();
  const { data, error } = await supabase.from('worker_setup').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchStaff(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('staff_members')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchWorker(id: string) {
  const supabase = await getClient();
  const { data, error } = await supabase

    .from('service_workers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}
