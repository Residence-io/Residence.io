import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

const databaseSuite =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

databaseSuite('Phase 1 PostgreSQL migration', () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = new Client({ connectionString: container.getConnectionUri() });
    await client.connect();
    const migration = await readFile(
      resolve(
        __dirname,
        '../prisma/migrations/20260714170000_phase_1_foundation/migration.sql',
      ),
      'utf8',
    );
    await client.query(migration);
  }, 120_000);

  it('creates identity, access, session, audit, and outbox tables', async () => {
    const result = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    expect(result.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'society',
        'user_account',
        'role',
        'permission',
        'user_session',
        'password_reset_token',
        'audit_log',
        'outbox_event',
      ]),
    );
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });
});
