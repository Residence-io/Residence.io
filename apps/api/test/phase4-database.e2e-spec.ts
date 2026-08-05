import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

const databaseSuite =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

databaseSuite('Phase 4 PostgreSQL migration and workforce integrity', () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;
  let societyId: string;
  let userId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = new Client({ connectionString: container.getConnectionUri() });
    await client.connect();
    for (const path of [
      '../prisma/migrations/20260714170000_phase_1_foundation/migration.sql',
      '../prisma/migrations/20260714210000_phase_2_resident_management/migration.sql',
      '../prisma/migrations/20260714230000_phase_3_dues_payments/migration.sql',
      '../prisma/migrations/20260716120000_phase_4_staff_workers/migration.sql',
    ])
      await client.query(await readFile(resolve(__dirname, path), 'utf8'));
    societyId = (
      await client.query<{ id: string }>(
        "INSERT INTO society(slug,name) VALUES('phase4-test','Phase 4') RETURNING id",
      )
    ).rows[0].id;
    userId = (
      await client.query<{ id: string }>(
        "INSERT INTO user_account(society_id,username,normalized_username,display_name,password_hash,updated_at) VALUES($1,'p4-admin','p4-admin','P4 Admin','hash',now()) RETURNING id",
        [societyId],
      )
    ).rows[0].id;
  }, 120_000);

  it('creates the Phase 4 workforce and salary tables', async () => {
    const rows = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    );
    expect(rows.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'staff_member',
        'employment_record',
        'salary_structure',
        'salary_record',
        'salary_payment',
        'salary_slip',
        'service_worker',
        'worker_availability',
        'worker_schedule_reservation',
      ]),
    );
  });

  it.each(['staff_id_sequence', 'worker_id_sequence'])(
    'allocates unique values concurrently from %s',
    async (table) => {
      const category = table === 'worker_id_sequence' ? 'PLUMBER' : null;
      const allocate = () =>
        category
          ? client.query<{ value: string }>(
              'INSERT INTO worker_id_sequence(society_id,category_code,sequence_year,next_value,updated_at) VALUES($1,$2,2026,2,now()) ON CONFLICT(society_id,category_code,sequence_year) DO UPDATE SET next_value=worker_id_sequence.next_value+1,updated_at=now() RETURNING next_value-1 value',
              [societyId, category],
            )
          : client.query<{ value: string }>(
              'INSERT INTO staff_id_sequence(society_id,sequence_year,next_value,updated_at) VALUES($1,2026,2,now()) ON CONFLICT(society_id,sequence_year) DO UPDATE SET next_value=staff_id_sequence.next_value+1,updated_at=now() RETURNING next_value-1 value',
              [societyId],
            );
      const values = await Promise.all(Array.from({ length: 20 }, allocate));
      expect(new Set(values.map((value) => value.rows[0].value)).size).toBe(20);
    },
  );

  it('rejects overlapping effective salary structures', async () => {
    const staffId = (
      await client.query<{ id: string }>(
        "INSERT INTO staff_member(society_id,staff_number,full_name,normalized_full_name,primary_phone,updated_at) VALUES($1,'STF-1','Staff','staff','+920000000',now()) RETURNING id",
        [societyId],
      )
    ).rows[0].id;
    await client.query(
      "INSERT INTO salary_structure(staff_id,basic_salary,currency,frequency,effective_from,created_by_user_id,updated_at) VALUES($1,1000,'PKR','MONTHLY','2026-01-01',$2,now())",
      [staffId, userId],
    );
    await expect(
      client.query(
        "INSERT INTO salary_structure(staff_id,basic_salary,currency,frequency,effective_from,created_by_user_id,updated_at) VALUES($1,1200,'PKR','MONTHLY','2026-06-01',$2,now())",
        [staffId, userId],
      ),
    ).rejects.toMatchObject({ code: '23P01' });
  });

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });
});
