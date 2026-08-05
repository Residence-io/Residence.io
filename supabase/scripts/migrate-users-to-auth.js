/**
 * S9 Production: Migrate PENDING user_account rows to Supabase Auth.
 *
 * PRE-REQUISITES:
 *   Add to root .env (or apps/api/.env):
 *     SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard → Settings → API>
 *     NEXT_PUBLIC_SUPABASE_URL=https://icffsyxlrgmwdjaazoue.supabase.co
 *
 * RUN:
 *   node supabase/scripts/migrate-users-to-auth.js
 *
 * STRATEGY:
 *  - ACTIVE users       → created as enabled in Supabase Auth
 *  - SUSPENDED/DEACTIVATED → created with ban_duration='876000h' (100 years)
 *  - Passwords          → random temp (users reset via forgot-password)
 *  - Email              → use existing OR generate {username}@residence.local
 */

const path = require('path');
const rootDir = path.resolve(__dirname, '..', '..');

// Try to load pg from project node_modules
let pg, createClient;
try {
  pg = require(path.join(rootDir, 'node_modules', 'pg'));
  createClient = require(
    path.join(rootDir, 'node_modules', '@supabase', 'supabase-js'),
  ).createClient;
} catch {
  // Fallback: try api app node_modules
  pg = require(path.join(rootDir, 'apps', 'api', 'node_modules', 'pg'));
  createClient = require(
    path.join(rootDir, 'node_modules', '@supabase', 'supabase-js'),
  ).createClient;
}

const fs = require('fs');
const crypto = require('crypto');

// Load env from root .env
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim().replace(/\r/, '');
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1);
    }
  }
  return env;
}

const env = {
  ...loadEnv(path.join(rootDir, '.env')),
  ...loadEnv(path.join(rootDir, 'apps', 'api', '.env')),
  ...process.env,
};

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'] || env['SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
const DIRECT_URL = env['DIRECT_URL'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DIRECT_URL) {
  console.error('Missing required env vars:');
  if (!SUPABASE_URL)
    console.error('  - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
  if (!SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  if (!DIRECT_URL) console.error('  - DIRECT_URL');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { Client } = pg;
const dbClient = new Client({ connectionString: DIRECT_URL });

function generateTempPassword() {
  return crypto.randomBytes(16).toString('hex') + 'Aa1!';
}

async function run() {
  await dbClient.connect();

  const { rows: pendingUsers } = await dbClient.query(
    `SELECT id, username, email, display_name, status
     FROM user_account
     WHERE auth_migration_state = 'PENDING'
     ORDER BY status, created_at`,
  );

  console.log(`\nFound ${pendingUsers.length} PENDING users to migrate\n`);
  if (pendingUsers.length === 0) {
    console.log('Nothing to do. All users are already migrated.');
    await dbClient.end();
    return;
  }

  // Get existing auth users once (avoid per-user API calls for dedup)
  const { data: allAuthUsers } = await adminClient.auth.admin.listUsers({
    perPage: 1000,
  });
  const existingByEmail = new Map(
    (allAuthUsers?.users ?? []).map((u) => [u.email?.toLowerCase(), u.id]),
  );

  let migrated = 0;
  let linked = 0;
  let errors = 0;

  for (const user of pendingUsers) {
    const email = (
      user.email || `${user.username.toLowerCase()}@residence.local`
    ).toLowerCase();
    const isActive = user.status === 'ACTIVE';

    try {
      let authUserId = existingByEmail.get(email);

      if (authUserId) {
        console.log(`  [LINK]   ${user.username} (${email}) → ${authUserId}`);
        linked++;
      } else {
        const payload = {
          email,
          password: generateTempPassword(),
          email_confirm: true,
          user_metadata: {
            username: user.username,
            display_name: user.display_name,
          },
        };
        if (!isActive) payload.ban_duration = '876000h';

        const { data: created, error } =
          await adminClient.auth.admin.createUser(payload);
        if (error) {
          console.error(`  [ERROR]  ${user.username}: ${error.message}`);
          errors++;
          continue;
        }

        authUserId = created.user.id;
        console.log(
          `  [CREATE] ${user.username} (${email}) → ${authUserId}${isActive ? '' : ' [BANNED]'}`,
        );
        migrated++;
      }

      // Update user_account
      await dbClient.query(
        `UPDATE user_account
         SET auth_user_id = $1, auth_migration_state = 'DONE', auth_migrated_at = now()
         WHERE id = $2`,
        [authUserId, user.id],
      );
    } catch (err) {
      console.error(`  [FATAL]  ${user.username}: ${err.message}`);
      errors++;
    }
  }

  await dbClient.end();

  console.log('\n' + '='.repeat(50));
  console.log(`Created:   ${migrated}`);
  console.log(`Linked:    ${linked}`);
  console.log(`Errors:    ${errors}`);
  console.log(`Total:     ${pendingUsers.length}`);
  console.log('='.repeat(50));
  if (errors > 0) process.exitCode = 1;
}

run().catch((e) => {
  console.error('FATAL:', e.message);
  process.exitCode = 1;
});
