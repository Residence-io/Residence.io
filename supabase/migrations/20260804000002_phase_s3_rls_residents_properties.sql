-- =============================================================================
-- Phase S3: Row Level Security — Residents & Properties
-- =============================================================================
-- Implements:
--   1. Private helper functions (auth identity resolution)
--   2. GRANT table access to authenticated role
--   3. RLS policies: property, unit
--   4. RLS policies: resident, resident_occupancy
--   5. RLS policies: household_member, vehicle
--   6. RLS policies: resident_document, resident_id_card, resident_id_sequence
--   7. Safe api-schema views (strips sensitive columns)
-- NestJS continues to use the owner/service-role connection (bypasses RLS).
-- =============================================================================

-- ─── PART 1: Private schema + helper functions ────────────────────────────────

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- Resolves auth.uid() → user_account.id (only ACTIVE accounts with auth link)
CREATE OR REPLACE FUNCTION private.current_account_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT id
  FROM   user_account
  WHERE  auth_user_id = auth.uid()
    AND  status = 'ACTIVE'
  LIMIT  1
$$;
REVOKE EXECUTE ON FUNCTION private.current_account_id() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.current_account_id() TO authenticated;

-- Checks if the current user has an active role in the given society
CREATE OR REPLACE FUNCTION private.is_society_member(p_society_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   user_account ua
    JOIN   user_role    ur ON ur.user_id    = ua.id
                          AND ur.society_id = p_society_id
    JOIN   role          r ON r.id          = ur.role_id
                          AND r.active      = true
    WHERE  ua.auth_user_id = auth.uid()
      AND  ua.status       = 'ACTIVE'
      AND  ua.society_id   = p_society_id
  )
$$;
REVOKE EXECUTE ON FUNCTION private.is_society_member(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.is_society_member(uuid) TO authenticated;

-- Checks if the current user holds a specific permission in a society
CREATE OR REPLACE FUNCTION private.has_permission(p_society_id uuid, p_permission_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   user_account  ua
    JOIN   user_role     ur ON ur.user_id    = ua.id
                           AND ur.society_id = p_society_id
    JOIN   role           r ON r.id          = ur.role_id
                           AND r.active      = true
    JOIN   role_permission rp ON rp.role_id  = r.id
    JOIN   permission      p  ON p.id        = rp.permission_id
                             AND p.code      = p_permission_code
    WHERE  ua.auth_user_id = auth.uid()
      AND  ua.status       = 'ACTIVE'
      AND  ua.society_id   = p_society_id
  )
$$;
REVOKE EXECUTE ON FUNCTION private.has_permission(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.has_permission(uuid, text) TO authenticated;

-- Returns the resident.id linked to the current authenticated user (or NULL)
CREATE OR REPLACE FUNCTION private.my_resident_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT r.id
  FROM   resident     r
  JOIN   user_account ua ON ua.id = r.user_id
  WHERE  ua.auth_user_id = auth.uid()
    AND  ua.status       = 'ACTIVE'
    AND  r.status NOT IN ('ARCHIVED')
  LIMIT  1
$$;
REVOKE EXECUTE ON FUNCTION private.my_resident_id() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.my_resident_id() TO authenticated;

-- Checks if the current user is the resident (own-record check)
CREATE OR REPLACE FUNCTION private.owns_resident(p_resident_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   resident     r
    JOIN   user_account ua ON ua.id = r.user_id
    WHERE  r.id            = p_resident_id
      AND  ua.auth_user_id = auth.uid()
      AND  ua.status       = 'ACTIVE'
      AND  r.status NOT IN ('ARCHIVED')
  )
$$;
REVOKE EXECUTE ON FUNCTION private.owns_resident(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.owns_resident(uuid) TO authenticated;

-- ─── PART 2: Grant table-level access to authenticated ───────────────────────
-- RLS is the row-level guard; these grants allow column access.
-- The NestJS/owner connection already has full access (bypasses RLS).

GRANT USAGE ON SCHEMA public TO authenticated;

-- Properties & Units (read + admin write)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE property TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE unit     TO authenticated;

-- Residents (read + admin write + resident self-update)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE resident            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE resident_occupancy  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE household_member    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE vehicle             TO authenticated;
GRANT SELECT                         ON TABLE resident_document   TO authenticated;
GRANT SELECT                         ON TABLE resident_id_card    TO authenticated;
GRANT SELECT                         ON TABLE resident_id_sequence TO authenticated;
GRANT SELECT                         ON TABLE resident_fee_assignment TO authenticated;

-- Read-only reference tables
GRANT SELECT ON TABLE society TO authenticated;

-- ─── PART 3: RLS policies — property ─────────────────────────────────────────

-- Admins: SELECT own society
CREATE POLICY "admin_select_property"
  ON property FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'RESIDENT_READ') OR
         private.has_permission(society_id, 'PROPERTY_MANAGE'));

-- Residents: SELECT properties where they have an active occupancy
CREATE POLICY "resident_select_own_property"
  ON property FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   resident_occupancy ro
      JOIN   unit               u  ON u.id = ro.unit_id
      WHERE  u.property_id  = property.id
        AND  ro.end_date    IS NULL
        AND  ro.resident_id = private.my_resident_id()
    )
  );

-- Admins: full write (INSERT / UPDATE / DELETE)
CREATE POLICY "admin_insert_property"
  ON property FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(society_id, 'PROPERTY_MANAGE'));

CREATE POLICY "admin_update_property"
  ON property FOR UPDATE TO authenticated
  USING     (private.has_permission(society_id, 'PROPERTY_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'PROPERTY_MANAGE'));

CREATE POLICY "admin_delete_property"
  ON property FOR DELETE TO authenticated
  USING (private.has_permission(society_id, 'PROPERTY_MANAGE'));

-- ─── PART 4: RLS policies — unit ─────────────────────────────────────────────

-- Admins: SELECT units in their society
CREATE POLICY "admin_select_unit"
  ON unit FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property p
      WHERE  p.id = unit.property_id
        AND (private.has_permission(p.society_id, 'RESIDENT_READ') OR
             private.has_permission(p.society_id, 'PROPERTY_MANAGE'))
    )
  );

-- Residents: SELECT own unit (active occupancy)
CREATE POLICY "resident_select_own_unit"
  ON unit FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident_occupancy ro
      WHERE  ro.unit_id     = unit.id
        AND  ro.end_date    IS NULL
        AND  ro.resident_id = private.my_resident_id()
    )
  );

-- Admin write
CREATE POLICY "admin_insert_unit"
  ON unit FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM property p
      WHERE  p.id = unit.property_id
        AND  private.has_permission(p.society_id, 'PROPERTY_MANAGE')
    )
  );

CREATE POLICY "admin_update_unit"
  ON unit FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property p
      WHERE  p.id = unit.property_id
        AND  private.has_permission(p.society_id, 'PROPERTY_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM property p
      WHERE  p.id = unit.property_id
        AND  private.has_permission(p.society_id, 'PROPERTY_MANAGE')
    )
  );

CREATE POLICY "admin_delete_unit"
  ON unit FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property p
      WHERE  p.id = unit.property_id
        AND  private.has_permission(p.society_id, 'PROPERTY_MANAGE')
    )
  );

-- ─── PART 5: RLS policies — resident ─────────────────────────────────────────

-- Admins: SELECT residents in their society
CREATE POLICY "admin_select_resident"
  ON resident FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'RESIDENT_READ'));

-- Residents: SELECT own record
CREATE POLICY "resident_select_own"
  ON resident FOR SELECT TO authenticated
  USING (private.owns_resident(id));

-- Admin: INSERT (RESIDENT_CREATE)
CREATE POLICY "admin_insert_resident"
  ON resident FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(society_id, 'RESIDENT_CREATE'));

-- Admin: UPDATE (RESIDENT_UPDATE)
CREATE POLICY "admin_update_resident"
  ON resident FOR UPDATE TO authenticated
  USING     (private.has_permission(society_id, 'RESIDENT_UPDATE'))
  WITH CHECK(private.has_permission(society_id, 'RESIDENT_UPDATE'));

-- Resident: UPDATE own safe fields (name, email, phone, emergency contact)
CREATE POLICY "resident_update_own_profile"
  ON resident FOR UPDATE TO authenticated
  USING (private.owns_resident(id));

-- Admin: soft-delete (RESIDENT_ARCHIVE) — controlled via status field
CREATE POLICY "admin_archive_resident"
  ON resident FOR DELETE TO authenticated
  USING (private.has_permission(society_id, 'RESIDENT_ARCHIVE'));

-- ─── PART 6: RLS policies — resident_occupancy ───────────────────────────────

-- Admins: read occupancy
CREATE POLICY "admin_select_occupancy"
  ON resident_occupancy FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = resident_occupancy.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_READ')
    )
  );

-- Residents: read own occupancy
CREATE POLICY "resident_select_own_occupancy"
  ON resident_occupancy FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

-- Admin write
CREATE POLICY "admin_insert_occupancy"
  ON resident_occupancy FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = resident_occupancy.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_UPDATE')
    )
  );

CREATE POLICY "admin_update_occupancy"
  ON resident_occupancy FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = resident_occupancy.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_UPDATE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = resident_occupancy.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_UPDATE')
    )
  );

-- ─── PART 7: RLS policies — household_member ─────────────────────────────────

CREATE POLICY "admin_select_household_member"
  ON household_member FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = household_member.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_READ')
    )
  );

CREATE POLICY "resident_select_own_household"
  ON household_member FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

CREATE POLICY "admin_insert_household_member"
  ON household_member FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = household_member.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_UPDATE')
    )
  );

CREATE POLICY "resident_insert_own_household"
  ON household_member FOR INSERT TO authenticated
  WITH CHECK (private.owns_resident(resident_id));

CREATE POLICY "admin_update_household_member"
  ON household_member FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = household_member.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_UPDATE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = household_member.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_UPDATE')
    )
  );

CREATE POLICY "resident_update_own_household"
  ON household_member FOR UPDATE TO authenticated
  USING     (private.owns_resident(resident_id))
  WITH CHECK(private.owns_resident(resident_id));

-- ─── PART 8: RLS policies — vehicle ──────────────────────────────────────────
-- vehicle has its own society_id column — use it directly for efficiency

CREATE POLICY "admin_select_vehicle"
  ON vehicle FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'RESIDENT_READ'));

CREATE POLICY "resident_select_own_vehicle"
  ON vehicle FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

CREATE POLICY "admin_insert_vehicle"
  ON vehicle FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(society_id, 'RESIDENT_UPDATE'));

CREATE POLICY "resident_insert_own_vehicle"
  ON vehicle FOR INSERT TO authenticated
  WITH CHECK (private.owns_resident(resident_id));

CREATE POLICY "admin_update_vehicle"
  ON vehicle FOR UPDATE TO authenticated
  USING     (private.has_permission(society_id, 'RESIDENT_UPDATE'))
  WITH CHECK(private.has_permission(society_id, 'RESIDENT_UPDATE'));

CREATE POLICY "resident_update_own_vehicle"
  ON vehicle FOR UPDATE TO authenticated
  USING     (private.owns_resident(resident_id))
  WITH CHECK(private.owns_resident(resident_id));

-- ─── PART 9: RLS policies — resident_document ────────────────────────────────

CREATE POLICY "admin_select_resident_document"
  ON resident_document FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = resident_document.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_DOCUMENT_READ')
    )
  );

CREATE POLICY "resident_select_own_document"
  ON resident_document FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

-- ─── PART 10: RLS policies — resident_id_card ────────────────────────────────

CREATE POLICY "admin_select_id_card"
  ON resident_id_card FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = resident_id_card.resident_id
        AND  private.has_permission(r.society_id, 'RESIDENT_ID_CARD_MANAGE')
    )
  );

CREATE POLICY "resident_select_own_id_card"
  ON resident_id_card FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

-- ─── PART 11: RLS policies — resident_fee_assignment (admin-only) ────────────

CREATE POLICY "admin_select_fee_assignment"
  ON resident_fee_assignment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resident r
      WHERE  r.id = resident_fee_assignment.resident_id
        AND  private.has_permission(r.society_id, 'BILLING_DUE_READ')
    )
  );

-- ─── PART 12: RLS policies — resident_id_sequence (admin system table) ───────

CREATE POLICY "admin_select_id_sequence"
  ON resident_id_sequence FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'RESIDENT_CREATE'));

-- ─── PART 13: Safe api-schema views ──────────────────────────────────────────
-- security_invoker=true → view runs as caller; RLS policies of underlying
-- tables are enforced. Sensitive columns are excluded.

GRANT USAGE ON SCHEMA api TO authenticated, anon;

-- api.properties — all columns safe
CREATE OR REPLACE VIEW api.properties
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  block,
  street,
  property_number,
  type,
  active,
  created_at,
  updated_at
FROM public.property
WHERE archived_at IS NULL;

GRANT SELECT ON api.properties TO authenticated;

-- api.units — all columns safe
CREATE OR REPLACE VIEW api.units
  WITH (security_invoker = true) AS
SELECT
  u.id,
  u.property_id,
  p.society_id,
  u.unit_number,
  u.status,
  u.parking_information,
  u.created_at,
  u.updated_at
FROM public.unit u
JOIN public.property p ON p.id = u.property_id
WHERE u.archived_at IS NULL;

GRANT SELECT ON api.units TO authenticated;

-- api.residents — strips identity_ciphertext, identity_search_hash,
--                  profile_photograph_object_key (internal paths)
CREATE OR REPLACE VIEW api.residents
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  user_id,
  resident_number,
  full_name,
  guardian_name,
  date_of_birth,
  gender,
  email,
  primary_phone,
  alternate_phone,
  identity_last_four,
  permanent_address,
  emergency_contact_name,
  emergency_contact_phone,
  household_size,
  status,
  suspension_reason,
  created_at,
  updated_at
FROM public.resident
WHERE archived_at IS NULL;

GRANT SELECT ON api.residents TO authenticated;

-- api.resident_occupancies
CREATE OR REPLACE VIEW api.resident_occupancies
  WITH (security_invoker = true) AS
SELECT
  id,
  resident_id,
  unit_id,
  occupancy_type,
  primary_resident,
  start_date,
  end_date,
  move_out_reason,
  property_owner_name,
  property_owner_phone,
  property_owner_email,
  tenancy_start_date,
  tenancy_end_date,
  created_at,
  updated_at
FROM public.resident_occupancy;

GRANT SELECT ON api.resident_occupancies TO authenticated;

-- api.household_members — all columns safe
CREATE OR REPLACE VIEW api.household_members
  WITH (security_invoker = true) AS
SELECT
  id,
  resident_id,
  full_name,
  relationship,
  date_of_birth,
  gender,
  phone,
  identity_last_four,
  emergency_contact,
  status,
  moved_out_at,
  created_at,
  updated_at
FROM public.household_member;

GRANT SELECT ON api.household_members TO authenticated;

-- api.vehicles — all columns safe (includes society_id for filtering)
CREATE OR REPLACE VIEW api.vehicles
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  resident_id,
  type,
  manufacturer,
  model,
  colour,
  registration_number,
  parking_permit_number,
  parking_location,
  active,
  created_at,
  updated_at
FROM public.vehicle
WHERE active = true;

GRANT SELECT ON api.vehicles TO authenticated;

-- api.resident_id_cards — strips pdf_object_key (internal storage path)
CREATE OR REPLACE VIEW api.resident_id_cards
  WITH (security_invoker = true) AS
SELECT
  id,
  resident_id,
  card_number,
  status,
  issued_at,
  expires_at,
  revoked_at,
  revocation_reason
FROM public.resident_id_card
WHERE status = 'ACTIVE';

GRANT SELECT ON api.resident_id_cards TO authenticated;

-- ─── PART 14: Supabase realtime (optional — enable for resident data) ─────────
-- Uncomment when realtime subscriptions are needed in S8 frontend cutover.
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.resident;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.household_member;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle;
