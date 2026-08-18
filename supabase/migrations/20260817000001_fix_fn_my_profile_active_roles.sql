-- Keep the authenticated application profile aligned with NestJS authorization.
-- Inactive roles must not appear in the role list or contribute permissions.
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

  SELECT array_agg(r.code ORDER BY r.code)
  INTO v_roles
  FROM user_role ur
  JOIN role r ON r.id = ur.role_id
  WHERE ur.user_id = v_id
    AND r.active = true;

  SELECT array_agg(DISTINCT p.code ORDER BY p.code)
  INTO v_permissions
  FROM user_role ur
  JOIN role r ON r.id = ur.role_id
  JOIN role_permission rp ON rp.role_id = r.id
  JOIN permission p ON p.id = rp.permission_id
  WHERE ur.user_id = v_id
    AND r.active = true;

  RETURN jsonb_build_object(
    'id',                  v_id,
    'societyId',           v_society_id,
    'username',            v_username,
    'displayName',         v_display_name,
    'forcePasswordChange', v_force_pw,
    'status',              v_status,
    'roles',               COALESCE(v_roles, ARRAY[]::text[]),
    'permissions',         COALESCE(v_permissions, ARRAY[]::text[]),
    'supabaseId',          auth.uid(),
    'csrfToken',           ''
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION api.fn_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.fn_my_profile() TO authenticated;
