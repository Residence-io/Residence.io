/**
 * Phase S4 — Create Supabase Storage buckets
 *
 * Run once after configuring SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Idempotent: safe to run multiple times.
 *
 * Usage: npx tsx apps/api/prisma/create-storage-buckets.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';

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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKETS = [
  {
    id: 'resident-documents',
    name: 'resident-documents',
    public: false,
    fileSizeLimit: 20 * 1024 * 1024, // 20 MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    id: 'generated-pdfs',
    name: 'generated-pdfs',
    public: false,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['application/pdf'],
  },
] as const;

async function run() {
  console.log('🪣 Creating Supabase Storage buckets...\n');

  for (const bucket of BUCKETS) {
    // Check if bucket already exists
    const { data: existing } = await supabase.storage.getBucket(bucket.id);

    if (existing) {
      console.log(`  ✓ ${bucket.id} — already exists, skipping`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: [...bucket.allowedMimeTypes],
    });

    if (error) {
      console.error(`  ❌ ${bucket.id} — ${error.message}`);
    } else {
      console.log(
        `  ✅ ${bucket.id} — created (private, ${bucket.fileSizeLimit / 1024 / 1024}MB limit)`,
      );
    }
  }

  console.log('\n✅ Done.');
}

run().catch(console.error);
