-- These indexes support current query predicates and were declared in the
-- Prisma schema but absent from the historical SQL migrations.
CREATE INDEX IF NOT EXISTS "complaint_administrator_assignment_complaint_id_ended_at_idx"
  ON "complaint_administrator_assignment" ("complaint_id", "ended_at");

CREATE INDEX IF NOT EXISTS "worker_assignment_maintenance_request_id_status_idx"
  ON "worker_assignment" ("maintenance_request_id", "status");
