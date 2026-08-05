import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';
const databaseSuite =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;
databaseSuite('Phase 3 PostgreSQL migration and financial integrity', () => {
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
    ])
      await client.query(await readFile(resolve(__dirname, path), 'utf8'));
  }, 120_000);
  it('creates all financial fact and projection tables', async () => {
    const result = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    );
    expect(result.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'fee_plan',
        'billing_period',
        'monthly_due',
        'due_line_item',
        'financial_ledger_entry',
        'payment',
        'payment_allocation',
        'payment_proof',
        'payment_adjustment',
        'discount_or_waiver',
        'payment_provider_transaction',
        'payment_reversal',
        'refund',
        'resident_credit_balance',
        'receipt',
        'receipt_sequence',
        'financial_batch',
      ]),
    );
  });
  it('enforces idempotent resident-period dues', async () => {
    const society = (
      await client.query<{ id: string }>(
        "INSERT INTO society(slug,name) VALUES('p3','P3') RETURNING id",
      )
    ).rows[0];
    const user = (
      await client.query<{ id: string }>(
        "INSERT INTO user_account(society_id,username,normalized_username,display_name,password_hash,updated_at) VALUES($1,'u','u','U','hash',now()) RETURNING id",
        [society.id],
      )
    ).rows[0];
    const resident = (
      await client.query<{ id: string }>(
        "INSERT INTO resident(society_id,resident_number,full_name,normalized_full_name,primary_phone,updated_at) VALUES($1,'R1','R','r','1',now()) RETURNING id",
        [society.id],
      )
    ).rows[0];
    const period = (
      await client.query<{ id: string }>(
        "INSERT INTO billing_period(society_id,year,month,starts_at,ends_at) VALUES($1,2026,1,'2026-01-01','2026-01-31') RETURNING id",
        [society.id],
      )
    ).rows[0];
    const insert = () =>
      client.query(
        "INSERT INTO monthly_due(society_id,resident_id,billing_period_id,currency,principal_amount,total_amount,due_date,grace_ends_at,fee_plan_snapshot,unit_snapshot,updated_at) VALUES($1,$2,$3,'PKR',100,100,'2026-01-10','2026-01-10','{}','{}',now())",
        [society.id, resident.id, period.id],
      );
    await insert();
    await expect(insert()).rejects.toMatchObject({ code: '23505' });
    expect(user.id).toBeTruthy();
  });
  it('prevents mutation of posted ledger facts', async () => {
    const ids = await client.query<{ society_id: string; resident_id: string }>(
      'SELECT society_id, id resident_id FROM resident LIMIT 1',
    );
    const row = (
      await client.query<{ id: string }>(
        "INSERT INTO financial_ledger_entry(society_id,resident_id,type,direction,amount,currency,event_date,reference,description,idempotency_key) VALUES($1,$2,'MONTHLY_DUE','DEBIT',100,'PKR',now(),'DUE','Due','ledger-1') RETURNING id",
        [ids.rows[0].society_id, ids.rows[0].resident_id],
      )
    ).rows[0];
    await expect(
      client.query('UPDATE financial_ledger_entry SET amount=1 WHERE id=$1', [
        row.id,
      ]),
    ).rejects.toThrow('immutable');
  });
  it('allocates unique receipt sequence numbers concurrently', async () => {
    const society = (
      await client.query<{ id: string }>('SELECT id FROM society LIMIT 1')
    ).rows[0];
    const allocate = () =>
      client.query<{ value: string }>(
        'INSERT INTO receipt_sequence(society_id,sequence_year,next_value,updated_at) VALUES($1,2026,2,now()) ON CONFLICT(society_id,sequence_year) DO UPDATE SET next_value=receipt_sequence.next_value+1,updated_at=now() RETURNING next_value-1 value',
        [society.id],
      );
    const values = await Promise.all(Array.from({ length: 20 }, allocate));
    expect(new Set(values.map((x) => x.rows[0].value)).size).toBe(20);
  });
  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });
});
