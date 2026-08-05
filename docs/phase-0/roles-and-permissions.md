# Phase 0 — Role and permission matrix

Permissions are checked in Java application services and resource policies. UI visibility is convenience only. `Own` means the resident linked to the authenticated user; `Granted` means a custom administrative role can receive the permission from a super administrator.

| Capability | Super admin | Administrator | Accounts manager | Maintenance manager | Resident |
|---|---:|---:|---:|---:|---:|
| Society profile/settings | Full | Granted | View financial subset | View maintenance subset | No |
| Admin accounts/custom roles | Full | Granted, never self-escalate | No | No | No |
| Security integrations/audit | Full | Granted | No | No | Own activity/sessions |
| Resident create/edit/status/archive | Full | Granted | View financial identity | View contact needed for tickets | Own profile; limited update request |
| Resident sensitive documents | Full | Granted | No by default | No | Own |
| ID-card generate/revoke | Full | Granted | View | No | Own download |
| Fees and dues configuration | Full | Granted | Full | No | View own |
| Record/verify payments | Full | Granted | Full | No | Initiate own online/bank proof |
| Adjust/waive/late fee | Full | Granted separately | Granted separately | No | No |
| Reverse confirmed transaction | Full + re-auth | Explicit grant + re-auth | Explicit grant + re-auth | No | No |
| Receipts/ledger/reports | Full | Granted | Full financial | No | Own |
| Staff/salary | Full | Granted | Salary payment/report grant | Staff directory only | No |
| Workers/categories | Full | Granted | No | Full | Assigned worker details only |
| Complaint manage | Full | Granted | No | Granted | Own |
| Sensitive complaint read | Full | Explicit grant only | No | Explicit grant only | Own |
| Maintenance manage/assign | Full | Granted | No | Full | Own submit/update/confirm/rate |
| Announcements | Full | Granted | Payment notices | Maintenance updates | Receive/read |
| Notification templates/send | Full | Granted | Payment scope | Ticket scope | Preferences where allowed |
| Exports | Full | Per-domain grant | Financial | Maintenance | Own documents only |
| Backup/retention/maintenance mode | Full | Explicit grant | No | No | No |

## Permission catalogue

Permission codes follow `DOMAIN_RESOURCE_ACTION`, for example:

- `ACCESS_ROLE_MANAGE`, `ACCESS_ADMIN_MANAGE`, `AUDIT_READ`, `SECURITY_SETTING_MANAGE`
- `RESIDENT_READ`, `RESIDENT_CREATE`, `RESIDENT_UPDATE`, `RESIDENT_STATUS_CHANGE`, `RESIDENT_ARCHIVE`, `RESIDENT_DOCUMENT_READ`
- `BILLING_DUE_READ`, `BILLING_FEE_MANAGE`, `PAYMENT_RECORD`, `PAYMENT_VERIFY`, `PAYMENT_ADJUST`, `PAYMENT_WAIVE`, `PAYMENT_REVERSE`, `FINANCIAL_REPORT_EXPORT`
- `STAFF_MANAGE`, `SALARY_READ`, `SALARY_PAY`, `WORKER_MANAGE`, `WORKER_ASSIGN`
- `COMPLAINT_READ`, `COMPLAINT_MANAGE`, `COMPLAINT_SENSITIVE_READ`, `MAINTENANCE_READ`, `MAINTENANCE_MANAGE`
- `NOTIFICATION_SEND`, `ANNOUNCEMENT_MANAGE`, `NOTIFICATION_LOG_READ`
- `SOCIETY_SETTING_MANAGE`, `INTEGRATION_MANAGE`, `DATA_EXPORT`, `BACKUP_MANAGE`, `RETENTION_MANAGE`

High-risk permission changes, transaction reversals, identity-document access, data exports, backup operations and confidential complaint access require an audit reason. Self-granting and management of a role equal to or above the actor's authority are prohibited.
