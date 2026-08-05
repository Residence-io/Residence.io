import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split(/\r?\n/)
  .filter(Boolean)
  .filter(
    (file) =>
      !file.endsWith('package-lock.json') &&
      !file.startsWith('docs/phase-0/') &&
      !file.endsWith('.png') &&
      !file.endsWith('.jpg') &&
      !file.endsWith('.pdf'),
  );
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bghp_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk_(?:live|prod)_[A-Za-z0-9]{20,}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
];
const findings = [];
for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    if (pattern.test(content)) findings.push(`${file}: ${pattern.source}`);
  }
}
if (findings.length) {
  process.stderr.write(
    `Potential committed secrets detected:\n${findings.join('\n')}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Secret scan passed for ${files.length} tracked text files.\n`,
  );
}
