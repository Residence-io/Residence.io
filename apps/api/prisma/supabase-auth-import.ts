/**
 * Phase S2 — Supabase Auth User Import Script
 *
 * Imports all ACTIVE + INVITED user accounts into Supabase Auth.
 * Run once after configuring SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   node -r ts-node/register apps/api/prisma/supabase-auth-import.ts
 *   (or: npx tsx apps/api/prisma/supabase-auth-import.ts)
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

// Load .env manually
const envContent = fs.readFileSync('.env', 'utf8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim().replace(/\r$/, '');
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1);
  }
}

const SUPABASE_URL = env['SUPABASE_URL'] ?? '';
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: env['DIRECT_URL'] ?? env['DATABASE_URL'] } },
});

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface ManifestRow {
  legacyId: string;
  username: string;
  email: string;
  supabaseId: string;
  status: string;
  migrationState: string;
}

async function run() {
  console.log('🔍 Loading accounts from database...');

  const accounts = await prisma.userAccount.findMany({
    where: {
      status: { in: ['ACTIVE', 'INVITED'] },
      authUserId: null, // Only unmigrated accounts
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      societyId: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📋 Found ${accounts.length} accounts to import.`);
  if (accounts.length === 0) {
    console.log('✅ All accounts already imported!');
    return;
  }

  const manifest: ManifestRow[] = [];
  let success = 0;
  let failed = 0;

  for (const account of accounts) {
    const email =
      account.email ?? `${account.username.toLowerCase()}@residence.local`;
    const tempPassword = crypto.randomBytes(24).toString('base64url');

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { displayName: account.displayName },
        app_metadata: {
          legacyId: account.id,
          societyId: account.societyId,
          username: account.username,
        },
      });

      if (error || !data.user) {
        console.error(
          `  ❌ ${account.username}: ${error?.message ?? 'unknown error'}`,
        );
        failed++;
        manifest.push({
          legacyId: account.id,
          username: account.username,
          email,
          supabaseId: '',
          status: account.status,
          migrationState: 'FAILED',
        });
        continue;
      }

      await prisma.userAccount.update({
        where: { id: account.id },
        data: {
          authUserId: data.user.id,
          authMigrationState: 'IMPORTED',
          authMigratedAt: new Date(),
        },
      });

      console.log(`  ✅ ${account.username} → ${data.user.id}`);
      success++;
      manifest.push({
        legacyId: account.id,
        username: account.username,
        email,
        supabaseId: data.user.id,
        status: account.status,
        migrationState: 'IMPORTED',
      });
    } catch (err) {
      console.error(`  ❌ ${account.username}: ${String(err)}`);
      failed++;
      manifest.push({
        legacyId: account.id,
        username: account.username,
        email,
        supabaseId: '',
        status: account.status,
        migrationState: 'FAILED',
      });
    }
  }

  // Write manifest CSV
  const csvLines = [
    'legacyId,username,email,supabaseId,accountStatus,migrationState',
    ...manifest.map(
      (r) =>
        `${r.legacyId},${r.username},${r.email},${r.supabaseId},${r.status},${r.migrationState}`,
    ),
  ];
  const csvPath = 'apps/api/prisma/supabase-auth-import-manifest.csv';
  fs.writeFileSync(csvPath, csvLines.join('\n'));

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`📄 Manifest: ${csvPath}`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
