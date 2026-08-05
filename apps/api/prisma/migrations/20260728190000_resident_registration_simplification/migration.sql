ALTER TABLE "household_member"
ADD COLUMN "age" INTEGER;

ALTER TABLE "household_member"
ADD CONSTRAINT "household_member_age_check"
CHECK ("age" IS NULL OR ("age" BETWEEN 1 AND 120));

ALTER TABLE "vehicle"
ADD COLUMN "name" VARCHAR(100),
ADD COLUMN "society_id" UUID;

UPDATE "vehicle" AS v
SET "society_id" = r."society_id"
FROM "resident" AS r
WHERE r."id" = v."resident_id";

ALTER TABLE "vehicle"
ALTER COLUMN "society_id" SET NOT NULL,
ADD CONSTRAINT "vehicle_society_id_fkey"
FOREIGN KEY ("society_id") REFERENCES "society"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX "vehicle_active_registration_unique";
DROP INDEX "vehicle_normalized_registration_number_active_idx";

CREATE INDEX "vehicle_society_registration_active_idx"
ON "vehicle"("society_id", "normalized_registration_number", "active");

CREATE UNIQUE INDEX "vehicle_active_society_registration_unique"
ON "vehicle"("society_id", "normalized_registration_number")
WHERE "active" = true;

CREATE UNIQUE INDEX "resident_society_identity_unique"
ON "resident"("society_id", "identity_search_hash");
