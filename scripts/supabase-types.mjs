import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const executable = join(
  root,
  'node_modules',
  'supabase',
  'dist',
  'supabase.js',
);
const result = spawnSync(
  process.execPath,
  [
    executable,
    'gen',
    'types',
    'typescript',
    '--local',
    '--schema',
    'public,api',
  ],
  {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || 'Supabase type generation failed.\n');
  process.exit(result.status ?? 1);
}

const output = join(
  root,
  'packages',
  'shared',
  'src',
  'supabase',
  'database.types.ts',
);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(
  output,
  `// Generated from the local Supabase schema. Do not edit manually.\n${result.stdout}`,
  'utf8',
);
const prettierCli = join(
  root,
  'node_modules',
  'prettier',
  'bin',
  'prettier.cjs',
);
const format = spawnSync(process.execPath, [prettierCli, '--write', output], {
  cwd: root,
  encoding: 'utf8',
});
if (format.status !== 0) {
  process.stderr.write(format.stderr || 'Generated type formatting failed.\n');
  process.exit(format.status ?? 1);
}
console.log('Generated local Supabase database types.');
