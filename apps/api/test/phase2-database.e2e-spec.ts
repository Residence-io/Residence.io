import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

const databaseSuite =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;
databaseSuite('Phase 2 PostgreSQL migration and integrity', () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;
  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = new Client({ connectionString: container.getConnectionUri() });
    await client.connect();
    for (const path of [
      '../prisma/migrations/20260714170000_phase_1_foundation/migration.sql',
      '../prisma/migrations/20260714210000_phase_2_resident_management/migration.sql',
    ])
      await client.query(await readFile(resolve(__dirname, path), 'utf8'));
  }, 120_000);
  it('creates the Phase 2 resident tables', async () => {
    const result = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    );
    expect(result.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'resident',
        'property',
        'unit',
        'resident_occupancy',
        'household_member',
        'vehicle',
        'resident_document',
        'resident_fee_assignment',
        'resident_id_card',
        'resident_id_sequence',
      ]),
    );
  });
  it('allocates unique resident sequence values under concurrency', async () => {
    const society = await client.query<{ id: string }>(
      "INSERT INTO society(slug,name) VALUES('phase2-test','Phase 2') RETURNING id",
    );
    const id = society.rows[0].id;
    const allocate = () =>
      client.query<{ value: string }>(
        `INSERT INTO resident_id_sequence(society_id,sequence_year,next_value) VALUES($1,2026,2) ON CONFLICT(society_id,sequence_year) DO UPDATE SET next_value=resident_id_sequence.next_value+1,updated_at=CURRENT_TIMESTAMP RETURNING next_value-1 AS value`,
        [id],
      );
    const values = await Promise.all(
      Array.from({ length: 20 }, () => allocate()),
    );
    expect(new Set(values.map((value) => value.rows[0].value)).size).toBe(20);
  });
  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });
});
