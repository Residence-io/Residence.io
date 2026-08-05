import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const executable = join(
  root,
  'node_modules',
  'supabase',
  'dist',
  'supabase.js',
);
const result = spawnSync(process.execPath, [executable, 'start'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
});

if (result.status !== 0) {
  console.error(
    'Local Supabase start failed. Run the pinned CLI interactively only in a private terminal for redacted diagnostics.',
  );
  process.exit(result.status ?? 1);
}

console.log(
  'Local Supabase stack started. Generated local credentials were suppressed.',
);
