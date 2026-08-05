import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

const databaseSuite =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

databaseSuite('Phase 8 fresh PostgreSQL installation', () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = new Client({ connectionString: container.getConnectionUri() });
    await client.connect();
    const migrationRoot = resolve(__dirname, '../prisma/migrations');
    const migrations = (await readdir(migrationRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    for (const migration of migrations) {
      const sql = await readFile(
        resolve(migrationRoot, migration, 'migration.sql'),
        'utf8',
      );
      await client.query(sql);
    }
  }, 180_000);

  it('applies the complete Phase 1-7 schema to an empty database', async () => {
    const result = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    );
    expect(result.rows.map(({ table_name }) => table_name)).toEqual(
      expect.arrayContaining([
        'user_account',
        'resident',
        'monthly_due',
        'staff_member',
        'maintenance_request',
        'notification',
        'financial_setting_period',
      ]),
    );
  });

  it('retains critical uniqueness and foreign-key constraints', async () => {
    const result = await client.query<{ constraint_type: string }>(
      `SELECT constraint_type FROM information_schema.table_constraints
       WHERE table_schema='public' AND table_name='user_account'`,
    );
    expect(result.rows.map(({ constraint_type }) => constraint_type)).toEqual(
      expect.arrayContaining(['PRIMARY KEY', 'FOREIGN KEY']),
    );
    const uniqueIndex = await client.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes
       WHERE schemaname='public'
         AND tablename='user_account'
         AND indexname='user_account_normalized_username_key'`,
    );
    expect(uniqueIndex.rows).toHaveLength(1);
    expect(uniqueIndex.rows[0].indexdef).toContain('UNIQUE INDEX');
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });
});
