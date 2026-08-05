-- Phase S1 exposes only the intentionally empty api schema.
-- Domain-specific grants and policies are deferred to later migration phases.
CREATE SCHEMA IF NOT EXISTS "api";

REVOKE ALL ON SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL ON SCHEMA "api" FROM PUBLIC, "anon", "authenticated";

REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."prevent_financial_ledger_mutation"()
  FROM "anon", "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON TABLES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON SEQUENCES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON FUNCTIONS FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "api"
  REVOKE ALL ON TABLES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "api"
  REVOKE ALL ON SEQUENCES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "api"
  REVOKE ALL ON FUNCTIONS FROM "anon", "authenticated";

-- Raw SQL migrations do not automatically enable RLS. Enable it without
-- policies on every current application table, which is deny-by-default for
-- non-owner roles while preserving the transitional NestJS owner connection.
DO $$
DECLARE
  application_table record;
BEGIN
  FOR application_table IN
    SELECT namespace.nspname AS schema_name, relation.relname AS table_name
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p')
      AND pg_catalog.pg_get_userbyid(relation.relowner) = current_user
      AND relation.relname NOT IN ('spatial_ref_sys', '_prisma_migrations')
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      application_table.schema_name,
      application_table.table_name
    );
  END LOOP;
END
$$;
