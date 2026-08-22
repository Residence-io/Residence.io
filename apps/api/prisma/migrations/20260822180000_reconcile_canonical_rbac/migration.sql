-- Migration 20: Reconcile Canonical RBAC Permissions and Role Mappings
-- Additive, forward-only, idempotent reconciliation across all societies

-- 1. Insert all missing canonical permissions
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'ACCESS_ROLE_MANAGE', 'Permission to access role manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'ACCESS_ADMIN_MANAGE', 'Permission to access admin manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'AUDIT_READ', 'Permission to audit read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'SECURITY_SETTING_MANAGE', 'Permission to security setting manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'SOCIETY_SETTING_MANAGE', 'Permission to society setting manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_READ', 'Permission to resident read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_CREATE', 'Permission to resident create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_UPDATE', 'Permission to resident update', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_STATUS_CHANGE', 'Permission to resident status change', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_ARCHIVE', 'Permission to resident archive', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_DOCUMENT_READ', 'Permission to resident document read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_DOCUMENT_MANAGE', 'Permission to resident document manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_ID_CARD_MANAGE', 'Permission to resident id card manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'PROPERTY_MANAGE', 'Permission to property manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'BILLING_DUE_READ', 'Permission to billing due read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'BILLING_FEE_MANAGE', 'Permission to billing fee manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'PAYMENT_RECORD', 'Permission to payment record', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'PAYMENT_VERIFY', 'Permission to payment verify', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'PAYMENT_ADJUST', 'Permission to payment adjust', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'PAYMENT_WAIVE', 'Permission to payment waive', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'PAYMENT_REVERSE', 'Permission to payment reverse', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'FINANCIAL_REPORT_EXPORT', 'Permission to financial report export', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'STAFF_MANAGE', 'Permission to staff manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'STAFF_DOCUMENT_READ', 'Permission to staff document read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'SALARY_READ', 'Permission to salary read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'SALARY_PAY', 'Permission to salary pay', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'SALARY_REVERSE', 'Permission to salary reverse', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'WORKER_MANAGE', 'Permission to worker manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'WORKER_SCHEDULE', 'Permission to worker schedule', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'WORKER_PERFORMANCE', 'Permission to worker performance', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'WORKFORCE_EXPORT', 'Permission to workforce export', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'COMPLAINT_MANAGE', 'Permission to complaint manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'COMPLAINT_READ', 'Permission to complaint read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'COMPLAINT_SENSITIVE_READ', 'Permission to complaint sensitive read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'MAINTENANCE_MANAGE', 'Permission to maintenance manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'MAINTENANCE_READ', 'Permission to maintenance read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'TICKET_EXPORT', 'Permission to ticket export', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'NOTIFICATION_SEND', 'Permission to notification send', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'NOTIFICATION_TEMPLATE_MANAGE', 'Permission to notification template manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'NOTIFICATION_LOG_READ', 'Permission to notification log read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'ANNOUNCEMENT_MANAGE', 'Permission to announcement manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'EMERGENCY_NOTIFICATION_SEND', 'Permission to emergency notification send', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'NOTIFICATION_PROVIDER_MANAGE', 'Permission to notification provider manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'REPORT_READ', 'Permission to report read', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'REPORT_EXPORT', 'Permission to report export', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'PROFILE_CORRECTION_MANAGE', 'Permission to profile correction manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VISITOR_VIEW', 'Permission to visitor view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VISITOR_CREATE', 'Permission to visitor create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VISITOR_APPROVE', 'Permission to visitor approve', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VISITOR_CHECK_IN', 'Permission to visitor check in', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VISITOR_CHECK_OUT', 'Permission to visitor check out', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'DELIVERY_VIEW', 'Permission to delivery view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'DELIVERY_CREATE', 'Permission to delivery create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'DELIVERY_COLLECT', 'Permission to delivery collect', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'DELIVERY_RETURN', 'Permission to delivery return', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'DELIVERY_ADMIN', 'Permission to delivery admin', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VEHICLE_VIEW', 'Permission to vehicle view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VEHICLE_CREATE', 'Permission to vehicle create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VEHICLE_APPROVE', 'Permission to vehicle approve', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VEHICLE_MANAGE', 'Permission to vehicle manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VEHICLE_VERIFY', 'Permission to vehicle verify', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VISITOR_ADMIN', 'Permission to visitor admin', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'FACILITY_VIEW', 'Permission to facility view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'FACILITY_CREATE', 'Permission to facility create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'FACILITY_UPDATE', 'Permission to facility update', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'FACILITY_MANAGE', 'Permission to facility manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'FACILITY_BOOKING_VIEW', 'Permission to facility booking view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'FACILITY_BOOKING_APPROVE', 'Permission to facility booking approve', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'FACILITY_BOOKING_MANAGE', 'Permission to facility booking manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_REQUEST_VIEW', 'Permission to resident request view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_REQUEST_REVIEW', 'Permission to resident request review', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_REQUEST_APPROVE', 'Permission to resident request approve', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_REQUEST_ISSUE', 'Permission to resident request issue', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'RESIDENT_REQUEST_MANAGE', 'Permission to resident request manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'MOVE_IN_VIEW', 'Permission to move in view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'MOVE_IN_MANAGE', 'Permission to move in manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'MOVE_IN_APPROVE', 'Permission to move in approve', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'MOVE_OUT_VIEW', 'Permission to move out view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'MOVE_OUT_MANAGE', 'Permission to move out manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'MOVE_OUT_APPROVE', 'Permission to move out approve', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'COMMUNITY_EVENT_VIEW', 'Permission to community event view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'COMMUNITY_EVENT_MANAGE', 'Permission to community event manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'EMERGENCY_CONTACT_MANAGE', 'Permission to emergency contact manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VENDOR_VIEW', 'Permission to vendor view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'VENDOR_MANAGE', 'Permission to vendor manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'EXPENSE_VIEW', 'Permission to expense view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'EXPENSE_CREATE', 'Permission to expense create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'EXPENSE_APPROVE', 'Permission to expense approve', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'EXPENSE_PAY', 'Permission to expense pay', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'EXPENSE_MANAGE', 'Permission to expense manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'BUDGET_VIEW', 'Permission to budget view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'BUDGET_MANAGE', 'Permission to budget manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'BUDGET_APPROVE', 'Permission to budget approve', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'BANK_ACCOUNT_VIEW', 'Permission to bank account view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'BANK_ACCOUNT_MANAGE', 'Permission to bank account manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'BANK_RECONCILE', 'Permission to bank reconcile', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'PAYMENT_PROVIDER_MANAGE', 'Permission to payment provider manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'ASSET_VIEW', 'Permission to asset view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'ASSET_CREATE', 'Permission to asset create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'ASSET_UPDATE', 'Permission to asset update', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'ASSET_MANAGE', 'Permission to asset manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'INVENTORY_VIEW', 'Permission to inventory view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'INVENTORY_CREATE', 'Permission to inventory create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'INVENTORY_ADJUST', 'Permission to inventory adjust', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'INVENTORY_ISSUE', 'Permission to inventory issue', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'INVENTORY_MANAGE', 'Permission to inventory manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'POLL_VIEW', 'Permission to poll view', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'POLL_CREATE', 'Permission to poll create', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'POLL_MANAGE', 'Permission to poll manage', NOW())
ON CONFLICT (code) DO NOTHING;
INSERT INTO permission (id, code, description, created_at)
VALUES (gen_random_uuid(), 'POLL_RESULTS', 'Permission to poll results', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure all canonical system roles exist for each active society
INSERT INTO role (id, society_id, code, display_name, description, system_role, active, created_at, updated_at)
SELECT gen_random_uuid(), s.id, 'SUPER_ADMINISTRATOR', 'Super Administrator', 'Society super administrator with full operational capabilities', true, true, NOW(), NOW()
FROM society s
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.society_id = s.id AND r.code = 'SUPER_ADMINISTRATOR'
);
INSERT INTO role (id, society_id, code, display_name, description, system_role, active, created_at, updated_at)
SELECT gen_random_uuid(), s.id, 'ADMINISTRATOR', 'Administrator', 'Society administrator with broad management access', true, true, NOW(), NOW()
FROM society s
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.society_id = s.id AND r.code = 'ADMINISTRATOR'
);
INSERT INTO role (id, society_id, code, display_name, description, system_role, active, created_at, updated_at)
SELECT gen_random_uuid(), s.id, 'ACCOUNTS_MANAGER', 'Accounts Manager', 'Manages billing, payments, dues, and accounts', true, true, NOW(), NOW()
FROM society s
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.society_id = s.id AND r.code = 'ACCOUNTS_MANAGER'
);
INSERT INTO role (id, society_id, code, display_name, description, system_role, active, created_at, updated_at)
SELECT gen_random_uuid(), s.id, 'MAINTENANCE_MANAGER', 'Maintenance Manager', 'Oversees maintenance tickets, workers, and schedules', true, true, NOW(), NOW()
FROM society s
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.society_id = s.id AND r.code = 'MAINTENANCE_MANAGER'
);
INSERT INTO role (id, society_id, code, display_name, description, system_role, active, created_at, updated_at)
SELECT gen_random_uuid(), s.id, 'SECURITY_GUARD', 'Security Guard', 'Guard for gate check-ins, visitors, parking, and deliveries', true, true, NOW(), NOW()
FROM society s
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.society_id = s.id AND r.code = 'SECURITY_GUARD'
);
INSERT INTO role (id, society_id, code, display_name, description, system_role, active, created_at, updated_at)
SELECT gen_random_uuid(), s.id, 'RESIDENT', 'Resident', 'Resident self-service portal role', true, true, NOW(), NOW()
FROM society s
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.society_id = s.id AND r.code = 'RESIDENT'
);

-- 3. Reconcile canonical role-permission grants for each society role
-- Role: SUPER_ADMINISTRATOR (110 permissions)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'SUPER_ADMINISTRATOR'
  AND p.code IN ('ACCESS_ROLE_MANAGE', 'ACCESS_ADMIN_MANAGE', 'AUDIT_READ', 'SECURITY_SETTING_MANAGE', 'SOCIETY_SETTING_MANAGE', 'RESIDENT_READ', 'RESIDENT_CREATE', 'RESIDENT_UPDATE', 'RESIDENT_STATUS_CHANGE', 'RESIDENT_ARCHIVE', 'RESIDENT_DOCUMENT_READ', 'RESIDENT_DOCUMENT_MANAGE', 'RESIDENT_ID_CARD_MANAGE', 'PROPERTY_MANAGE', 'BILLING_DUE_READ', 'BILLING_FEE_MANAGE', 'PAYMENT_RECORD', 'PAYMENT_VERIFY', 'PAYMENT_ADJUST', 'PAYMENT_WAIVE', 'PAYMENT_REVERSE', 'FINANCIAL_REPORT_EXPORT', 'STAFF_MANAGE', 'STAFF_DOCUMENT_READ', 'SALARY_READ', 'SALARY_PAY', 'SALARY_REVERSE', 'WORKER_MANAGE', 'WORKER_SCHEDULE', 'WORKER_PERFORMANCE', 'WORKFORCE_EXPORT', 'COMPLAINT_MANAGE', 'COMPLAINT_READ', 'COMPLAINT_SENSITIVE_READ', 'MAINTENANCE_MANAGE', 'MAINTENANCE_READ', 'TICKET_EXPORT', 'NOTIFICATION_SEND', 'NOTIFICATION_TEMPLATE_MANAGE', 'NOTIFICATION_LOG_READ', 'ANNOUNCEMENT_MANAGE', 'EMERGENCY_NOTIFICATION_SEND', 'NOTIFICATION_PROVIDER_MANAGE', 'REPORT_READ', 'REPORT_EXPORT', 'PROFILE_CORRECTION_MANAGE', 'VISITOR_VIEW', 'VISITOR_CREATE', 'VISITOR_APPROVE', 'VISITOR_CHECK_IN', 'VISITOR_CHECK_OUT', 'DELIVERY_VIEW', 'DELIVERY_CREATE', 'DELIVERY_COLLECT', 'DELIVERY_RETURN', 'DELIVERY_ADMIN', 'VEHICLE_VIEW', 'VEHICLE_CREATE', 'VEHICLE_APPROVE', 'VEHICLE_MANAGE', 'VEHICLE_VERIFY', 'VISITOR_ADMIN', 'FACILITY_VIEW', 'FACILITY_CREATE', 'FACILITY_UPDATE', 'FACILITY_MANAGE', 'FACILITY_BOOKING_VIEW', 'FACILITY_BOOKING_APPROVE', 'FACILITY_BOOKING_MANAGE', 'RESIDENT_REQUEST_VIEW', 'RESIDENT_REQUEST_REVIEW', 'RESIDENT_REQUEST_APPROVE', 'RESIDENT_REQUEST_ISSUE', 'RESIDENT_REQUEST_MANAGE', 'MOVE_IN_VIEW', 'MOVE_IN_MANAGE', 'MOVE_IN_APPROVE', 'MOVE_OUT_VIEW', 'MOVE_OUT_MANAGE', 'MOVE_OUT_APPROVE', 'COMMUNITY_EVENT_VIEW', 'COMMUNITY_EVENT_MANAGE', 'EMERGENCY_CONTACT_MANAGE', 'VENDOR_VIEW', 'VENDOR_MANAGE', 'EXPENSE_VIEW', 'EXPENSE_CREATE', 'EXPENSE_APPROVE', 'EXPENSE_PAY', 'EXPENSE_MANAGE', 'BUDGET_VIEW', 'BUDGET_MANAGE', 'BUDGET_APPROVE', 'BANK_ACCOUNT_VIEW', 'BANK_ACCOUNT_MANAGE', 'BANK_RECONCILE', 'PAYMENT_PROVIDER_MANAGE', 'ASSET_VIEW', 'ASSET_CREATE', 'ASSET_UPDATE', 'ASSET_MANAGE', 'INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_ADJUST', 'INVENTORY_ISSUE', 'INVENTORY_MANAGE', 'POLL_VIEW', 'POLL_CREATE', 'POLL_MANAGE', 'POLL_RESULTS')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Role: ADMINISTRATOR (95 permissions)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'ADMINISTRATOR'
  AND p.code IN ('RESIDENT_READ', 'RESIDENT_CREATE', 'RESIDENT_UPDATE', 'RESIDENT_STATUS_CHANGE', 'RESIDENT_ARCHIVE', 'RESIDENT_DOCUMENT_READ', 'RESIDENT_DOCUMENT_MANAGE', 'RESIDENT_ID_CARD_MANAGE', 'PROPERTY_MANAGE', 'ACCESS_ADMIN_MANAGE', 'SOCIETY_SETTING_MANAGE', 'BILLING_DUE_READ', 'BILLING_FEE_MANAGE', 'PAYMENT_RECORD', 'PAYMENT_VERIFY', 'PAYMENT_ADJUST', 'PAYMENT_WAIVE', 'PAYMENT_REVERSE', 'FINANCIAL_REPORT_EXPORT', 'STAFF_MANAGE', 'STAFF_DOCUMENT_READ', 'SALARY_READ', 'SALARY_PAY', 'SALARY_REVERSE', 'WORKER_MANAGE', 'WORKER_SCHEDULE', 'WORKER_PERFORMANCE', 'WORKFORCE_EXPORT', 'COMPLAINT_READ', 'COMPLAINT_MANAGE', 'COMPLAINT_SENSITIVE_READ', 'MAINTENANCE_READ', 'MAINTENANCE_MANAGE', 'VISITOR_VIEW', 'VISITOR_CREATE', 'VISITOR_APPROVE', 'VISITOR_ADMIN', 'VISITOR_CHECK_IN', 'VISITOR_CHECK_OUT', 'TICKET_EXPORT', 'NOTIFICATION_SEND', 'NOTIFICATION_TEMPLATE_MANAGE', 'NOTIFICATION_LOG_READ', 'ANNOUNCEMENT_MANAGE', 'REPORT_READ', 'REPORT_EXPORT', 'PROFILE_CORRECTION_MANAGE', 'FACILITY_VIEW', 'FACILITY_CREATE', 'FACILITY_UPDATE', 'FACILITY_MANAGE', 'FACILITY_BOOKING_VIEW', 'FACILITY_BOOKING_APPROVE', 'FACILITY_BOOKING_MANAGE', 'RESIDENT_REQUEST_VIEW', 'RESIDENT_REQUEST_REVIEW', 'RESIDENT_REQUEST_APPROVE', 'RESIDENT_REQUEST_ISSUE', 'RESIDENT_REQUEST_MANAGE', 'MOVE_IN_VIEW', 'MOVE_IN_MANAGE', 'MOVE_IN_APPROVE', 'MOVE_OUT_VIEW', 'MOVE_OUT_MANAGE', 'MOVE_OUT_APPROVE', 'COMMUNITY_EVENT_VIEW', 'COMMUNITY_EVENT_MANAGE', 'EMERGENCY_CONTACT_MANAGE', 'VENDOR_VIEW', 'VENDOR_MANAGE', 'EXPENSE_VIEW', 'EXPENSE_CREATE', 'EXPENSE_APPROVE', 'EXPENSE_PAY', 'EXPENSE_MANAGE', 'BUDGET_VIEW', 'BUDGET_MANAGE', 'BUDGET_APPROVE', 'BANK_ACCOUNT_VIEW', 'BANK_ACCOUNT_MANAGE', 'BANK_RECONCILE', 'PAYMENT_PROVIDER_MANAGE', 'ASSET_VIEW', 'ASSET_CREATE', 'ASSET_UPDATE', 'ASSET_MANAGE', 'INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_ADJUST', 'INVENTORY_ISSUE', 'INVENTORY_MANAGE', 'POLL_VIEW', 'POLL_CREATE', 'POLL_MANAGE', 'POLL_RESULTS')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Role: ACCOUNTS_MANAGER (29 permissions)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'ACCOUNTS_MANAGER'
  AND p.code IN ('RESIDENT_READ', 'BILLING_DUE_READ', 'BILLING_FEE_MANAGE', 'PAYMENT_RECORD', 'PAYMENT_VERIFY', 'PAYMENT_ADJUST', 'PAYMENT_WAIVE', 'PAYMENT_REVERSE', 'FINANCIAL_REPORT_EXPORT', 'SALARY_READ', 'SALARY_PAY', 'SALARY_REVERSE', 'WORKFORCE_EXPORT', 'NOTIFICATION_SEND', 'NOTIFICATION_LOG_READ', 'REPORT_READ', 'REPORT_EXPORT', 'COMMUNITY_EVENT_VIEW', 'VENDOR_VIEW', 'VENDOR_MANAGE', 'EXPENSE_VIEW', 'EXPENSE_CREATE', 'EXPENSE_PAY', 'EXPENSE_MANAGE', 'BUDGET_VIEW', 'BANK_ACCOUNT_VIEW', 'BANK_RECONCILE', 'ASSET_VIEW', 'INVENTORY_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Role: MAINTENANCE_MANAGER (27 permissions)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'MAINTENANCE_MANAGER'
  AND p.code IN ('RESIDENT_READ', 'WORKER_MANAGE', 'WORKER_SCHEDULE', 'WORKER_PERFORMANCE', 'WORKFORCE_EXPORT', 'COMPLAINT_MANAGE', 'COMPLAINT_READ', 'MAINTENANCE_MANAGE', 'MAINTENANCE_READ', 'TICKET_EXPORT', 'NOTIFICATION_SEND', 'NOTIFICATION_LOG_READ', 'REPORT_READ', 'REPORT_EXPORT', 'FACILITY_VIEW', 'FACILITY_UPDATE', 'FACILITY_BOOKING_VIEW', 'COMMUNITY_EVENT_VIEW', 'ASSET_VIEW', 'ASSET_CREATE', 'ASSET_UPDATE', 'ASSET_MANAGE', 'INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_ADJUST', 'INVENTORY_ISSUE', 'INVENTORY_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Role: SECURITY_GUARD (9 permissions)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'SECURITY_GUARD'
  AND p.code IN ('VISITOR_VIEW', 'VISITOR_CREATE', 'VISITOR_CHECK_IN', 'VISITOR_CHECK_OUT', 'DELIVERY_VIEW', 'DELIVERY_CREATE', 'DELIVERY_COLLECT', 'DELIVERY_RETURN', 'VEHICLE_VERIFY')
ON CONFLICT (role_id, permission_id) DO NOTHING;

