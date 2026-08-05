import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

const databaseSuite =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

jest.setTimeout(180_000);

const originalMigrationCount = 7;
const recoveredMigrations = [
  '20260728190000_resident_registration_simplification',
  '20260728200000_resident_profile_photo_integrity',
  '20260730200000_allow_resident_cnic_multiple_properties',
];
const execFileAsync = promisify(execFile);

databaseSuite('Prisma schema and PostgreSQL migration compatibility', () => {
  let container: StartedPostgreSqlContainer;
  let freshClient: Client;
  let upgradeClient: Client;
  let migrations: string[];

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    migrations = (
      await readdir(resolve(__dirname, '../prisma/migrations'), {
        withFileTypes: true,
      })
    )
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    freshClient = new Client({
      connectionString: container.getConnectionUri(),
    });
    await freshClient.connect();

    const administrator = new Client({
      connectionString: container.getConnectionUri(),
    });
    await administrator.connect();
    await administrator.query('CREATE DATABASE residence_upgrade');
    await administrator.end();

    const upgradeUrl = new URL(container.getConnectionUri());
    upgradeUrl.pathname = '/residence_upgrade';
    upgradeClient = new Client({ connectionString: upgradeUrl.toString() });
    await upgradeClient.connect();
  }, 180_000);

  it('applies every migration to a fresh database and supports generated-client queries', async () => {
    expect(migrations.slice(-3)).toEqual(recoveredMigrations);
    await applyMigrations(freshClient, migrations);
    const fixture = await insertFixture(freshClient, true, 'fresh');

    await expectClientCompatibility(
      container.getConnectionUri(),
      fixture.societyId,
    );
  });

  it('upgrades the original seven-migration database without losing representative data', async () => {
    await applyMigrations(
      upgradeClient,
      migrations.slice(0, originalMigrationCount),
    );
    const fixture = await insertFixture(upgradeClient, false, 'upgrade');
    await applyMigrations(
      upgradeClient,
      migrations.slice(originalMigrationCount),
    );

    const upgradeUrl = new URL(container.getConnectionUri());
    upgradeUrl.pathname = '/residence_upgrade';
    await expectClientCompatibility(upgradeUrl.toString(), fixture.societyId);

    const preserved = await upgradeClient.query<{ count: string }>(
      'SELECT count(*) FROM resident WHERE society_id = $1',
      [fixture.societyId],
    );
    expect(preserved.rows[0].count).toBe('1');
  });

  afterAll(async () => {
    await freshClient?.end();
    await upgradeClient?.end();
    await container?.stop();
  });
});

async function applyMigrations(client: Client, names: string[]): Promise<void> {
  const migrationRoot = resolve(__dirname, '../prisma/migrations');
  for (const name of names) {
    const sql = await readFile(
      resolve(migrationRoot, name, 'migration.sql'),
      'utf8',
    );
    await client.query(sql);
  }
}

async function insertFixture(
  client: Client,
  currentSchema: boolean,
  suffix: string,
): Promise<{ societyId: string }> {
  const society = await client.query<{ id: string }>(
    'INSERT INTO society(slug, name) VALUES($1, $2) RETURNING id',
    [`schema-smoke-${suffix}`, `Schema Smoke ${suffix}`],
  );
  const societyId = society.rows[0].id;
  const user = await client.query<{ id: string }>(
    `INSERT INTO user_account(
       society_id, username, normalized_username, display_name, password_hash, status
     ) VALUES($1, $2, $3, $4, $5, 'ACTIVE') RETURNING id`,
    [
      societyId,
      `schema-smoke-${suffix}`,
      `SCHEMA-SMOKE-${suffix.toUpperCase()}`,
      'Schema Smoke User',
      'synthetic-non-authenticating-hash',
    ],
  );
  const resident = await client.query<{ id: string }>(
    `INSERT INTO resident(
       society_id, resident_number, full_name, normalized_full_name, primary_phone
     ) VALUES($1, $2, $3, $4, $5) RETURNING id`,
    [
      societyId,
      `RES-${suffix}`,
      'Synthetic Resident',
      'SYNTHETIC RESIDENT',
      '0000000000',
    ],
  );

  if (currentSchema) {
    await client.query(
      `INSERT INTO vehicle(
         society_id, resident_id, type, name, registration_number,
         normalized_registration_number
       ) VALUES($1, $2, $3, $4, $5, $6)`,
      [
        societyId,
        resident.rows[0].id,
        'Car',
        'Synthetic Car',
        `TEST-${suffix}`,
        `TEST${suffix.toUpperCase()}`,
      ],
    );
  } else {
    await client.query(
      `INSERT INTO vehicle(
         resident_id, type, registration_number, normalized_registration_number
       ) VALUES($1, $2, $3, $4)`,
      [
        resident.rows[0].id,
        'Car',
        `TEST-${suffix}`,
        `TEST${suffix.toUpperCase()}`,
      ],
    );
  }

  await client.query(
    `INSERT INTO fee_plan(
       society_id, name, scope, monthly_base_amount, currency,
       effective_from, created_by_user_id, updated_at
     ) VALUES(
       $1, $2, 'SOCIETY_DEFAULT', 1000, 'PKR', DATE '2026-01-01', $3,
       CURRENT_TIMESTAMP
     )`,
    [societyId, `Default ${suffix}`, user.rows[0].id],
  );
  return { societyId };
}

async function expectClientCompatibility(
  connectionString: string,
  societyId: string,
): Promise<void> {
  await execFileAsync(
    process.execPath,
    [
      resolve(__dirname, '../../../node_modules/tsx/dist/cli.mjs'),
      resolve(__dirname, 'prisma-schema-smoke-runner.ts'),
    ],
    {
      cwd: resolve(__dirname, '..'),
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        SCHEMA_SMOKE_SOCIETY_ID: societyId,
      },
    },
  );
}
