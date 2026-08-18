-- =============================================================================
-- Phase S8: fn_my_profile RPC — Frontend Cutover Auth Foundation
-- =============================================================================
-- Returns the full AuthenticatedUser profile (roles + permissions) for the
-- currently authenticated Supabase user.
-- Called by Next.js Server Components to replace the NestJS /auth/me endpoint.
-- =============================================================================

CREATE OR REPLACE FUNCTION api.fn_my_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
DECLARE
  v_id           uuid;
  v_society_id   uuid;
  v_username     text;
  v_display_name text;
  v_force_pw     boolean;
  v_status       text;
  v_roles        text[];
  v_permissions  text[];
BEGIN
  -- Resolve user_account from Supabase auth session
  SELECT
    id,
    society_id,
    username,
    display_name,
    force_password_change,
    status::text
  INTO
    v_id,
    v_society_id,
    v_username,
    v_display_name,
    v_force_pw,
    v_status
  FROM user_account
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Collect role codes for this user
  SELECT array_agg(r.code ORDER BY r.code)
  INTO   v_roles
  FROM   user_role ur
  JOIN   role r ON r.id = ur.role_id
  WHERE  ur.user_id = v_id
    AND  r.active = true;

  -- Collect distinct permission codes across all assigned roles
  SELECT array_agg(DISTINCT p.code ORDER BY p.code)
  INTO   v_permissions
  FROM   user_role ur
  JOIN   role r             ON r.id        = ur.role_id
  JOIN   role_permission rp ON rp.role_id   = r.id
  JOIN   permission p       ON p.id         = rp.permission_id
  WHERE  ur.user_id = v_id
    AND  r.active = true;

  RETURN jsonb_build_object(
    'id',                  v_id,
    'societyId',           v_society_id,
    'username',            v_username,
    'displayName',         v_display_name,
    'forcePasswordChange', v_force_pw,
    'status',              v_status,
    'roles',               COALESCE(v_roles,       ARRAY[]::text[]),
    'permissions',         COALESCE(v_permissions, ARRAY[]::text[]),
    'supabaseId',          auth.uid(),
    'csrfToken',           ''
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION api.fn_my_profile() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION api.fn_my_profile() TO authenticated;

-- =============================================================================
-- Grant read access to user_role, role, permission, role_permission
-- (needed for the fn_my_profile SECURITY DEFINER to see all rows)
-- =============================================================================

-- These are already readable via SECURITY DEFINER, but grant to authenticated
-- in case future policies need direct reads
GRANT SELECT ON TABLE user_role      TO authenticated;
GRANT SELECT ON TABLE role           TO authenticated;
GRANT SELECT ON TABLE permission     TO authenticated;
GRANT SELECT ON TABLE role_permission TO authenticated;

-- RLS for user_role (own user reads own roles)
CREATE POLICY "s8_own_user_role"
  ON user_role FOR SELECT TO authenticated
  USING (user_id = private.current_account_id());

CREATE POLICY "s8_admin_user_role"
  ON user_role FOR SELECT TO authenticated
  USING (
    private.has_permission(society_id, 'ACCESS_ROLE_MANAGE')
  );

-- RLS for role (all society members can read role names)
CREATE POLICY "s8_select_role"
  ON role FOR SELECT TO authenticated
  USING (private.is_society_member(society_id));

-- RLS for permission (all authenticated users can read permission codes)
CREATE POLICY "s8_select_permission"
  ON permission FOR SELECT TO authenticated
  USING (true);

-- RLS for role_permission (admins only)
CREATE POLICY "s8_admin_role_permission"
  ON role_permission FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role r
      WHERE r.id = role_permission.role_id
        AND private.has_permission(r.society_id, 'ACCESS_ROLE_MANAGE')
    )
  );

-- =============================================================================
-- api schema view for user profile
-- =============================================================================

CREATE OR REPLACE VIEW api.my_profile
  WITH (security_invoker = true) AS
SELECT
  ua.id,
  ua.society_id,
  ua.username,
  ua.display_name,
  ua.email,
  ua.force_password_change,
  ua.status,
  ua.auth_user_id
FROM public.user_account ua
WHERE ua.auth_user_id = auth.uid();

GRANT SELECT ON api.my_profile TO authenticated;
