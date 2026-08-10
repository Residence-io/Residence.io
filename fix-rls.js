const { Client } = require('pg');

const client = new Client({
  connectionString:
    'postgresql://postgres.icffsyxlrgmwdjaazoue:koL%40cHi_125@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
});

async function safe(label, sql) {
  try {
    await client.query(sql);
    console.log('OK:', label);
  } catch (e) {
    console.log('SKIP:', label, '-', e.message);
  }
}

async function run() {
  await client.connect();
  console.log('Connected!\n');

  // monthly_due — INSERT + UPDATE
  await safe('monthly_due INSERT', `
    CREATE POLICY "admin_insert_monthly_due" ON monthly_due
    FOR INSERT TO authenticated WITH CHECK (true)
  `);
  await safe('monthly_due UPDATE', `
    CREATE POLICY "admin_update_monthly_due" ON monthly_due
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true)
  `);

  // resident_occupancy — INSERT (in case existing one is wrong)
  await safe('occupancy INSERT v2', `
    CREATE POLICY "admin_insert_occupancy_v2" ON resident_occupancy
    FOR INSERT TO authenticated WITH CHECK (true)
  `);

  // property — all operations
  await safe('property ALL', `
    CREATE POLICY "admin_manage_property" ON property
    FOR ALL TO authenticated USING (true) WITH CHECK (true)
  `);

  // unit — all operations
  await safe('unit ALL', `
    CREATE POLICY "admin_manage_unit" ON unit
    FOR ALL TO authenticated USING (true) WITH CHECK (true)
  `);

  // audit_log — select for admin
  await safe('audit_log SELECT', `
    CREATE POLICY "admin_select_audit_log" ON audit_log
    FOR SELECT TO authenticated USING (true)
  `);

  // Check audit_log table exists
  try {
    const { rows } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'audit_log' LIMIT 5
    `);
    console.log('audit_log columns:', rows.map(r => r.column_name).join(', ') || 'TABLE NOT FOUND');
  } catch(e) {
    console.log('audit_log check failed:', e.message);
  }

  await client.end();
  console.log('\nDone!');
}

run().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
