-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('INVITED', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "visitor_pass" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "unit_id" UUID,
    "visitor_name" VARCHAR(160) NOT NULL,
    "visitor_phone" VARCHAR(30) NOT NULL,
    "visitor_cnic" VARCHAR(30),
    "purpose" VARCHAR(300) NOT NULL,
    "vehicle_number" VARCHAR(50),
    "number_of_guests" INTEGER NOT NULL DEFAULT 1,
    "visit_date" DATE NOT NULL,
    "window_start" TIME,
    "window_end" TIME,
    "pass_code" VARCHAR(30) NOT NULL,
    "qr_token" VARCHAR(128) NOT NULL,
    "status" "VisitorStatus" NOT NULL DEFAULT 'INVITED',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_days" VARCHAR(50),
    "recurring_until" DATE,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "visitor_pass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_check_in" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "visitor_pass_id" UUID NOT NULL,
    "gate" VARCHAR(100) NOT NULL,
    "checked_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_out_at" TIMESTAMPTZ(6),
    "guard_user_id" UUID NOT NULL,
    "vehicle_number" VARCHAR(50),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_check_in_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visitor_pass_pass_code_key" ON "visitor_pass"("pass_code");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_pass_qr_token_key" ON "visitor_pass"("qr_token");

-- CreateIndex
CREATE INDEX "visitor_pass_society_id_visit_date_idx" ON "visitor_pass"("society_id", "visit_date");

-- CreateIndex
CREATE INDEX "visitor_pass_resident_id_visit_date_idx" ON "visitor_pass"("resident_id", "visit_date");

-- CreateIndex
CREATE INDEX "visitor_pass_status_visit_date_idx" ON "visitor_pass"("status", "visit_date");

-- CreateIndex
CREATE INDEX "visitor_check_in_society_id_checked_in_at_idx" ON "visitor_check_in"("society_id", "checked_in_at");

-- CreateIndex
CREATE INDEX "visitor_check_in_visitor_pass_id_idx" ON "visitor_check_in"("visitor_pass_id");

-- CreateIndex
CREATE INDEX "visitor_check_in_guard_user_id_idx" ON "visitor_check_in"("guard_user_id");

-- AddForeignKey
ALTER TABLE "visitor_pass" ADD CONSTRAINT "visitor_pass_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_pass" ADD CONSTRAINT "visitor_pass_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_pass" ADD CONSTRAINT "visitor_pass_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_check_in" ADD CONSTRAINT "visitor_check_in_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_check_in" ADD CONSTRAINT "visitor_check_in_visitor_pass_id_fkey" FOREIGN KEY ("visitor_pass_id") REFERENCES "visitor_pass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_check_in" ADD CONSTRAINT "visitor_check_in_guard_user_id_fkey" FOREIGN KEY ("guard_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add Partial Unique Constraints
CREATE UNIQUE INDEX one_active_checkin_per_pass ON visitor_check_in (visitor_pass_id) WHERE checked_out_at IS NULL;