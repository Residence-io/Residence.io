import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

const databaseSuite =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;
databaseSuite('Phase 6 PostgreSQL migration and notification integrity', () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;
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
      '../prisma/migrations/20260718120000_phase_6_notifications/migration.sql',
    ])
      await client.query(await readFile(resolve(__dirname, path), 'utf8'));
  }, 120_000);
  it('creates durable notification tables', async () => {
    const result = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    );
    expect(result.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'notification',
        'notification_recipient',
        'notification_delivery',
        'notification_schedule',
        'notification_template_version',
        'announcement_audience_snapshot',
        'provider_callback_event',
        'notification_job_claim',
      ]),
    );
  });
  it('creates the multi-instance delivery claim index', async () => {
    const result = await client.query<{ indexname: string }>(
      "SELECT indexname FROM pg_indexes WHERE tablename IN ('notification_delivery','notification_job_claim')",
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(4);
  });
  it('enforces batch idempotency at the database boundary', async () => {
    const society = await client.query<{ id: string }>(
      "INSERT INTO society(slug,name) VALUES('p6','P6') RETURNING id",
    );
    const user = await client.query<{ id: string }>(
      "INSERT INTO user_account(society_id,username,normalized_username,display_name,password_hash,status) VALUES($1,'p6','p6','P6','not-a-real-hash','ACTIVE') RETURNING id",
      [society.rows[0].id],
    );
    await client.query(
      "INSERT INTO notification_batch(society_id,name,kind,criteria,recipient_snapshot,idempotency_key,created_by_user_id,updated_at) VALUES($1,'B','CUSTOM','{}','[]','same-key',$2,now())",
      [society.rows[0].id, user.rows[0].id],
    );
    await expect(
      client.query(
        "INSERT INTO notification_batch(society_id,name,kind,criteria,recipient_snapshot,idempotency_key,created_by_user_id,updated_at) VALUES($1,'B','CUSTOM','{}','[]','same-key',$2,now())",
        [society.rows[0].id, user.rows[0].id],
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });
  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });
});
