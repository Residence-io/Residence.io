-- =============================================================================
-- Phase S5: Row Level Security + api Views — Finance Module
-- =============================================================================
-- Covers: fee_plan, billing_period, financial_batch, monthly_due,
--         due_line_item, financial_ledger_entry, payment, payment_allocation,
--         payment_proof, payment_adjustment, payment_reversal, refund,
--         payment_provider_transaction, receipt, resident_credit_balance,
--         receipt_sequence, fee_plan_component, late_fee_rule
--
-- Access model:
--   Admins  : permission-checked (BILLING_DUE_READ / BILLING_FEE_MANAGE etc.)
--   Residents: read own dues, ledger, payments, receipts, credit balance
--   NestJS  : service_role connection — bypasses RLS (no changes)
-- =============================================================================

-- ─── PART 1: Grant table access to authenticated ──────────────────────────────

-- Fee plan (admin read/write, residents don't read directly)
GRANT SELECT, INSERT, UPDATE ON TABLE fee_plan           TO authenticated;
GRANT SELECT, INSERT         ON TABLE fee_plan_component TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE late_fee_rule      TO authenticated;

-- Billing lifecycle (admin-only write, resident read own)
GRANT SELECT, INSERT, UPDATE ON TABLE billing_period           TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE financial_batch          TO authenticated;
GRANT SELECT                  ON TABLE monthly_due              TO authenticated;
GRANT SELECT                  ON TABLE due_line_item            TO authenticated;
GRANT SELECT                  ON TABLE financial_ledger_entry   TO authenticated;
GRANT SELECT                  ON TABLE payment_adjustment       TO authenticated;

-- Payments (resident can read own)
GRANT SELECT, INSERT, UPDATE ON TABLE payment                        TO authenticated;
GRANT SELECT                  ON TABLE payment_allocation             TO authenticated;
GRANT SELECT, INSERT          ON TABLE payment_proof                  TO authenticated;
GRANT SELECT                  ON TABLE payment_reversal               TO authenticated;
GRANT SELECT                  ON TABLE refund                         TO authenticated;
GRANT SELECT                  ON TABLE payment_provider_transaction   TO authenticated;

-- Receipts & balances
GRANT SELECT ON TABLE receipt                TO authenticated;
GRANT SELECT ON TABLE receipt_sequence       TO authenticated;
GRANT SELECT ON TABLE resident_credit_balance TO authenticated;

-- ─── PART 2: RLS — fee_plan ───────────────────────────────────────────────────

CREATE POLICY "s5_admin_select_fee_plan"
  ON fee_plan FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'BILLING_DUE_READ'));

CREATE POLICY "s5_admin_insert_fee_plan"
  ON fee_plan FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(society_id, 'BILLING_FEE_MANAGE'));

CREATE POLICY "s5_admin_update_fee_plan"
  ON fee_plan FOR UPDATE TO authenticated
  USING     (private.has_permission(society_id, 'BILLING_FEE_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'BILLING_FEE_MANAGE'));

-- ─── PART 3: RLS — fee_plan_component ────────────────────────────────────────

CREATE POLICY "s5_admin_select_fee_plan_component"
  ON fee_plan_component FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fee_plan fp
      WHERE fp.id = fee_plan_component.fee_plan_id
        AND private.has_permission(fp.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_admin_insert_fee_plan_component"
  ON fee_plan_component FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fee_plan fp
      WHERE fp.id = fee_plan_component.fee_plan_id
        AND private.has_permission(fp.society_id, 'BILLING_FEE_MANAGE')
    )
  );

-- ─── PART 4: RLS — late_fee_rule ─────────────────────────────────────────────

CREATE POLICY "s5_admin_select_late_fee_rule"
  ON late_fee_rule FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fee_plan fp
      WHERE fp.id = late_fee_rule.fee_plan_id
        AND private.has_permission(fp.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_admin_write_late_fee_rule"
  ON late_fee_rule FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fee_plan fp
      WHERE fp.id = late_fee_rule.fee_plan_id
        AND private.has_permission(fp.society_id, 'BILLING_FEE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fee_plan fp
      WHERE fp.id = late_fee_rule.fee_plan_id
        AND private.has_permission(fp.society_id, 'BILLING_FEE_MANAGE')
    )
  );

-- ─── PART 5: RLS — billing_period + financial_batch ──────────────────────────

CREATE POLICY "s5_admin_select_billing_period"
  ON billing_period FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'BILLING_DUE_READ'));

CREATE POLICY "s5_admin_write_billing_period"
  ON billing_period FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'BILLING_FEE_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'BILLING_FEE_MANAGE'));

CREATE POLICY "s5_admin_select_financial_batch"
  ON financial_batch FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'BILLING_DUE_READ'));

CREATE POLICY "s5_admin_write_financial_batch"
  ON financial_batch FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'BILLING_FEE_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'BILLING_FEE_MANAGE'));

-- ─── PART 6: RLS — monthly_due ───────────────────────────────────────────────

CREATE POLICY "s5_admin_select_monthly_due"
  ON monthly_due FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'BILLING_DUE_READ'));

CREATE POLICY "s5_resident_select_own_due"
  ON monthly_due FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

-- ─── PART 7: RLS — due_line_item ─────────────────────────────────────────────

CREATE POLICY "s5_admin_select_due_line_item"
  ON due_line_item FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM monthly_due md
      WHERE md.id = due_line_item.monthly_due_id
        AND private.has_permission(md.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_resident_select_own_due_line_item"
  ON due_line_item FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM monthly_due md
      WHERE md.id = due_line_item.monthly_due_id
        AND private.owns_resident(md.resident_id)
    )
  );

-- ─── PART 8: RLS — financial_ledger_entry ────────────────────────────────────
-- Note: DB trigger already prevents UPDATE/DELETE (immutable ledger)

CREATE POLICY "s5_admin_select_ledger"
  ON financial_ledger_entry FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'BILLING_DUE_READ'));

CREATE POLICY "s5_resident_select_own_ledger"
  ON financial_ledger_entry FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

-- ─── PART 9: RLS — payment ───────────────────────────────────────────────────

CREATE POLICY "s5_admin_select_payment"
  ON payment FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'BILLING_DUE_READ'));

CREATE POLICY "s5_resident_select_own_payment"
  ON payment FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

CREATE POLICY "s5_admin_insert_payment"
  ON payment FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(society_id, 'PAYMENT_RECORD'));

CREATE POLICY "s5_admin_update_payment"
  ON payment FOR UPDATE TO authenticated
  USING     (private.has_permission(society_id, 'PAYMENT_VERIFY') OR
             private.has_permission(society_id, 'PAYMENT_REVERSE'))
  WITH CHECK(private.has_permission(society_id, 'PAYMENT_VERIFY') OR
             private.has_permission(society_id, 'PAYMENT_REVERSE'));

-- ─── PART 10: RLS — payment_allocation ───────────────────────────────────────

CREATE POLICY "s5_admin_select_payment_allocation"
  ON payment_allocation FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = payment_allocation.payment_id
        AND private.has_permission(p.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_resident_select_own_allocation"
  ON payment_allocation FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = payment_allocation.payment_id
        AND private.owns_resident(p.resident_id)
    )
  );

-- ─── PART 11: RLS — payment_proof ────────────────────────────────────────────

CREATE POLICY "s5_admin_select_payment_proof"
  ON payment_proof FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = payment_proof.payment_id
        AND private.has_permission(p.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_resident_select_own_proof"
  ON payment_proof FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = payment_proof.payment_id
        AND private.owns_resident(p.resident_id)
    )
  );

-- ─── PART 12: RLS — payment_adjustment ───────────────────────────────────────

CREATE POLICY "s5_admin_select_payment_adjustment"
  ON payment_adjustment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM monthly_due md
      WHERE md.id = payment_adjustment.monthly_due_id
        AND private.has_permission(md.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_resident_select_own_adjustment"
  ON payment_adjustment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM monthly_due md
      WHERE md.id = payment_adjustment.monthly_due_id
        AND private.owns_resident(md.resident_id)
    )
  );

-- ─── PART 13: RLS — payment_reversal + refund ────────────────────────────────

CREATE POLICY "s5_admin_select_payment_reversal"
  ON payment_reversal FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = payment_reversal.payment_id
        AND private.has_permission(p.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_resident_select_own_reversal"
  ON payment_reversal FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = payment_reversal.payment_id
        AND private.owns_resident(p.resident_id)
    )
  );

CREATE POLICY "s5_admin_select_refund"
  ON refund FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = refund.payment_id
        AND private.has_permission(p.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_resident_select_own_refund"
  ON refund FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = refund.payment_id
        AND private.owns_resident(p.resident_id)
    )
  );

-- ─── PART 14: RLS — payment_provider_transaction ─────────────────────────────

CREATE POLICY "s5_admin_select_provider_txn"
  ON payment_provider_transaction FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = payment_provider_transaction.payment_id
        AND private.has_permission(p.society_id, 'BILLING_DUE_READ')
    )
  );

-- ─── PART 15: RLS — receipt ──────────────────────────────────────────────────
-- pdf_object_key and verification_hash are excluded from api view

CREATE POLICY "s5_admin_select_receipt"
  ON receipt FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = receipt.payment_id
        AND private.has_permission(p.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_resident_select_own_receipt"
  ON receipt FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment p
      WHERE p.id = receipt.payment_id
        AND private.owns_resident(p.resident_id)
    )
  );

-- ─── PART 16: RLS — resident_credit_balance ──────────────────────────────────

CREATE POLICY "s5_admin_select_credit_balance"
  ON resident_credit_balance FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE r.id = resident_credit_balance.resident_id
        AND private.has_permission(r.society_id, 'BILLING_DUE_READ')
    )
  );

CREATE POLICY "s5_resident_select_own_balance"
  ON resident_credit_balance FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

-- ─── PART 17: RLS — receipt_sequence (system table, admin only) ──────────────

CREATE POLICY "s5_admin_select_receipt_sequence"
  ON receipt_sequence FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'BILLING_DUE_READ'));

-- ─── PART 18: api schema finance views ───────────────────────────────────────

-- api.dues — strips fee_plan_snapshot (may contain sensitive pricing details)
CREATE OR REPLACE VIEW api.dues
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  resident_id,
  billing_period_id,
  fee_plan_id,
  financial_batch_id,
  status,
  currency,
  principal_amount,
  total_amount,
  paid_amount,
  waived_amount,
  due_date,
  grace_ends_at,
  unit_snapshot,
  created_at,
  updated_at
FROM public.monthly_due;

GRANT SELECT ON api.dues TO authenticated;

-- api.due_line_items — all columns safe
CREATE OR REPLACE VIEW api.due_line_items
  WITH (security_invoker = true) AS
SELECT
  id,
  monthly_due_id,
  type,
  description,
  amount,
  created_at
FROM public.due_line_item;

GRANT SELECT ON api.due_line_items TO authenticated;

-- api.ledger_entries — all columns safe (amount, type, direction, date)
CREATE OR REPLACE VIEW api.ledger_entries
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  resident_id,
  monthly_due_id,
  payment_id,
  type,
  direction,
  amount,
  currency,
  event_date,
  reference,
  description,
  created_at
FROM public.financial_ledger_entry;

GRANT SELECT ON api.ledger_entries TO authenticated;

-- api.payments — strips internal notes visible only to admins
CREATE OR REPLACE VIEW api.payments
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  resident_id,
  amount,
  currency,
  payment_date,
  method,
  status,
  transaction_reference,
  allocation_strategy,
  confirmed_at,
  reversed_at,
  created_at,
  updated_at
FROM public.payment;

GRANT SELECT ON api.payments TO authenticated;

-- api.payment_allocations — all columns safe
CREATE OR REPLACE VIEW api.payment_allocations
  WITH (security_invoker = true) AS
SELECT
  id,
  payment_id,
  monthly_due_id,
  amount,
  created_at
FROM public.payment_allocation;

GRANT SELECT ON api.payment_allocations TO authenticated;

-- api.receipts — strips pdf_object_key (internal path) and verification_hash
CREATE OR REPLACE VIEW api.receipts
  WITH (security_invoker = true) AS
SELECT
  id,
  payment_id,
  receipt_number,
  status,
  issued_by_user_id,
  issued_at,
  reversed_at,
  created_at
FROM public.receipt;

GRANT SELECT ON api.receipts TO authenticated;

-- api.credit_balances — own balance
CREATE OR REPLACE VIEW api.credit_balances
  WITH (security_invoker = true) AS
SELECT
  resident_id,
  amount,
  currency,
  updated_at
FROM public.resident_credit_balance;

GRANT SELECT ON api.credit_balances TO authenticated;

-- api.fee_plans — safe view for residents to see their fee plan details
CREATE OR REPLACE VIEW api.fee_plans
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  name,
  description,
  scope,
  monthly_base_amount,
  currency,
  effective_from,
  effective_to,
  due_day,
  grace_period_days,
  late_fee_type,
  late_fee_value,
  active,
  created_at,
  updated_at
FROM public.fee_plan;

GRANT SELECT ON api.fee_plans TO authenticated;

-- ─── PART 19: PostgreSQL RPCs ─────────────────────────────────────────────────

-- RPC 1: fn_next_receipt_number
-- Atomically increments receipt sequence and returns next formatted number.
-- Called by NestJS ReceiptService — replaces inline raw SQL.
-- SECURITY DEFINER so it bypasses RLS on receipt_sequence.
CREATE OR REPLACE FUNCTION api.fn_next_receipt_number(
  p_society_id uuid,
  p_year       int
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next bigint;
BEGIN
  INSERT INTO receipt_sequence (society_id, sequence_year, next_value, updated_at)
  VALUES (p_society_id, p_year, 2, now())
  ON CONFLICT (society_id, sequence_year)
  DO UPDATE SET
    next_value = receipt_sequence.next_value + 1,
    updated_at = now()
  RETURNING next_value - 1 INTO v_next;

  RETURN 'RCT-' || p_year::text || '-' || LPAD(v_next::text, 6, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION api.fn_next_receipt_number(uuid, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION api.fn_next_receipt_number(uuid, int) TO authenticated;

-- RPC 2: fn_resident_financial_summary
-- Returns a resident's current financial position in one query.
-- Used for S8 dashboard — replaces multiple NestJS ledger queries.
CREATE OR REPLACE FUNCTION api.fn_resident_financial_summary(
  p_resident_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
DECLARE
  v_resident_id uuid;
  v_total_due   numeric;
  v_total_paid  numeric;
  v_balance     numeric;
  v_credit      numeric;
  v_currency    text;
  v_open_dues   int;
BEGIN
  -- Verify caller owns this resident record
  SELECT r.id INTO v_resident_id
  FROM   resident r
  JOIN   user_account ua ON ua.id = r.user_id
  WHERE  r.id            = p_resident_id
    AND  ua.auth_user_id = auth.uid()
    AND  ua.status       = 'ACTIVE'
  LIMIT 1;

  IF v_resident_id IS NULL THEN
    -- Allow admins with BILLING_DUE_READ
    SELECT r.id INTO v_resident_id
    FROM   resident r
    WHERE  r.id = p_resident_id
      AND  private.has_permission(r.society_id, 'BILLING_DUE_READ');
  END IF;

  IF v_resident_id IS NULL THEN
    RAISE EXCEPTION 'Access denied or resident not found';
  END IF;

  -- Aggregate dues
  SELECT
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(paid_amount),  0),
    COALESCE(MAX(currency), 'PKR'),
    COUNT(*) FILTER (WHERE status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE'))
  INTO v_total_due, v_total_paid, v_currency, v_open_dues
  FROM monthly_due
  WHERE resident_id = p_resident_id
    AND status NOT IN ('CANCELLED', 'WAIVED');

  v_balance := v_total_due - v_total_paid;

  -- Advance credit balance
  SELECT COALESCE(amount, 0)
  INTO   v_credit
  FROM   resident_credit_balance
  WHERE  resident_id = p_resident_id;

  RETURN jsonb_build_object(
    'residentId',   p_resident_id,
    'currency',     v_currency,
    'totalDue',     v_total_due,
    'totalPaid',    v_total_paid,
    'outstanding',  GREATEST(v_balance, 0),
    'advanceCredit',COALESCE(v_credit, 0),
    'openDues',     v_open_dues
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION api.fn_resident_financial_summary(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION api.fn_resident_financial_summary(uuid) TO authenticated;
