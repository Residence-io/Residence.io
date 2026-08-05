-- Phase S2: Custom Access Token Hook
-- Supabase calls this function before issuing JWT to inject app claims.
-- Claims added: legacyId (user_account.id), societyId, username, roles

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_rec  record;
  role_codes   text[];
BEGIN
  -- Find user_account linked to this Supabase auth user
  SELECT id, society_id, username, display_name, force_password_change, status
  INTO account_rec
  FROM user_account
  WHERE auth_user_id = (event->>'user_id')::uuid
  LIMIT 1;

  -- If no linked account or inactive — return event as-is
  -- The NestJS guard will reject the request
  IF NOT FOUND OR account_rec.status != 'ACTIVE' THEN
    RETURN event;
  END IF;

  -- Collect active role codes for this user
  SELECT array_agg(DISTINCT r.code)
  INTO role_codes
  FROM user_role ur
  JOIN role r ON r.id = ur.role_id
  WHERE ur.user_id = account_rec.id
    AND r.active = true;

  -- Inject into app_metadata (server-trusted, not user-editable)
  RETURN
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(event,
            '{claims,app_metadata,legacyId}',
            to_jsonb(account_rec.id::text)),
          '{claims,app_metadata,societyId}',
          to_jsonb(account_rec.society_id::text)),
        '{claims,app_metadata,username}',
        to_jsonb(account_rec.username::text)),
      '{claims,app_metadata,roles}',
      COALESCE(to_jsonb(role_codes), '[]'::jsonb)
    );
END;
$$;

-- Only Supabase auth service can call this hook
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
