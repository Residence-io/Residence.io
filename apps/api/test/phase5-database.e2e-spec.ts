import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

const databaseSuite =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;
databaseSuite('Phase 5 PostgreSQL migration and ticket integrity', () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;
  let societyId: string;
  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = new Client({ connectionString: container.getConnectionUri() });
    await client.connect();
    for (const path of [
      '../prisma/migrations/20260714170000_phase_1_foundation/migration.sql',
      '../prisma/migrations/20260714210000_phase_2_resident_management/migration.sql',
      '../prisma/migrations/20260714230000_phase_3_dues_payments/migration.sql',
      '../prisma/migrations/20260716120000_phase_4_staff_workers/migration.sql',
      '../prisma/migrations/20260717120000_phase_5_complaints_maintenance/migration.sql',
    ])
      await client.query(await readFile(resolve(__dirname, path), 'utf8'));
    societyId = (
      await client.query<{ id: string }>(
        "INSERT INTO society(slug,name) VALUES('p5','P5') RETURNING id",
      )
    ).rows[0].id;
  }, 120_000);
  it('creates complaint, maintenance, assignment, scheduling, SLA, and rating tables', async () => {
    const result = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    );
    expect(result.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'complaint',
        'maintenance_request',
        'worker_assignment',
        'maintenance_appointment',
        'service_level_policy',
        'escalation_record',
        'service_rating',
        'contact_disclosure_log',
      ]),
    );
  });
  it.each(['COMPLAINT', 'MAINTENANCE'])(
    'allocates unique %s ticket sequence values concurrently',
    async (type) => {
      const allocate = () =>
        client.query<{ value: string }>(
          'INSERT INTO ticket_sequence(society_id,ticket_type,sequence_year,next_value,updated_at) VALUES($1,$2::"TicketType",2026,2,now()) ON CONFLICT(society_id,ticket_type,sequence_year) DO UPDATE SET next_value=ticket_sequence.next_value+1,updated_at=now() RETURNING next_value-1 value',
          [societyId, type],
        );
      const values = await Promise.all(Array.from({ length: 20 }, allocate));
      expect(new Set(values.map((value) => value.rows[0].value)).size).toBe(20);
    },
  );
  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });
});
