-- Create partial unique index to enforce that a unit can have only one active primary occupant at a time
CREATE UNIQUE INDEX IF NOT EXISTS "uk_resident_occupancy_unit_active_primary"
ON "resident_occupancy" ("unit_id")
WHERE "primary_resident" = true AND "end_date" IS NULL;
