import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';

const root = resolve(import.meta.dirname, '..');
const executable = join(
  root,
  'node_modules',
  'supabase',
  'dist',
  'supabase.js',
);

function fail(message) {
  throw new Error(message);
}

function localStatus() {
  const result = spawnSync(
    process.execPath,
    [executable, 'status', '--output', 'json'],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
    },
  );
  if (result.status !== 0) fail('The local Supabase stack is not running.');
  const start = result.stdout.indexOf('{');
  if (start < 0) fail('Supabase status did not return JSON.');
  return JSON.parse(result.stdout.slice(start));
}

function verifyMigrationCopies() {
  const manifest = JSON.parse(
    readFileSync(join(root, 'supabase', 'migration-manifest.json'), 'utf8'),
  );
  for (const migration of manifest.historicalMigrations) {
    const source = readFileSync(join(root, migration.source));
    const target = readFileSync(join(root, migration.target));
    const sourceHash = createHash('sha256').update(source).digest('hex');
    const targetHash = createHash('sha256').update(target).digest('hex');
    if (sourceHash !== migration.sha256 || targetHash !== migration.sha256) {
      fail(`Historical migration checksum mismatch: ${migration.version}.`);
    }
  }
  return manifest.historicalMigrations.map((migration) => migration.version);
}

const historicalVersions = verifyMigrationCopies();
const status = localStatus();
const databaseUrl = status.DB_URL ?? status.db_url;
if (!databaseUrl) fail('Supabase status omitted the local database URL.');

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const server = await client.query('SHOW server_version_num');
  if (!server.rows[0].server_version_num.startsWith('17')) {
    fail('Local Supabase must use its supported PostgreSQL major version 17.');
  }

  const extensions = await client.query(
    `SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'btree_gist')`,
  );
  if (extensions.rowCount !== 2)
    fail('Required PostgreSQL extensions are missing.');

  const migrations = await client.query(
    'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version',
  );
  const applied = new Set(migrations.rows.map((row) => row.version));
  const expected = [...historicalVersions, '20260801000000', '20260801001000'];
  for (const version of expected) {
    if (!applied.has(version))
      fail(`Supabase migration ${version} is not applied.`);
  }

  const tables = await client.query(`
    SELECT c.relname, c.relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relname NOT IN ('spatial_ref_sys', '_prisma_migrations')
  `);
  if (tables.rowCount < 100)
    fail('The expected Residence.io application tables are missing.');
  const unprotected = tables.rows.filter((table) => !table.relrowsecurity);
  if (unprotected.length > 0) {
    fail(`RLS is not enabled on ${unprotected.length} application table(s).`);
  }

  const apiSchema = await client.query(
    `SELECT 1 FROM pg_namespace WHERE nspname = 'api'`,
  );
  if (apiSchema.rowCount !== 1) fail('The restricted API schema is missing.');

  const browserGrants = await client.query(`
    SELECT 1
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
    LIMIT 1
  `);
  if (browserGrants.rowCount > 0)
    fail('A browser role can access a public application table.');

  const feePlanDrift = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fee_plan' AND column_name = 'property_id'
  `);
  if (feePlanDrift.rowCount > 0)
    fail('The incompatible fee_plan.property_id column is present.');

  const indexes = await client.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname IN (
      'complaint_administrator_assignment_complaint_id_ended_at_idx',
      'worker_assignment_maintenance_request_id_status_idx'
    )
  `);
  if (indexes.rowCount !== 2)
    fail('A required Phase S1 query index is missing.');

  const ledgerTrigger = await client.query(`
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'financial_ledger_entry'
      AND t.tgname = 'financial_ledger_no_update'
      AND NOT t.tgisinternal
  `);
  if (ledgerTrigger.rowCount !== 1)
    fail('The immutable ledger trigger is missing.');

  console.log(
    `Supabase verification passed: ${migrations.rowCount} migrations, ${tables.rowCount} protected application tables.`,
  );
} finally {
  await client.end();
}
