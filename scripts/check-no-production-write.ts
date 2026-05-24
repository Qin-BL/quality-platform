import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function checkEnvExample(): boolean {
  const envExamplePath = resolve(ROOT, '.env.example');
  if (!existsSync(envExamplePath)) {
    console.log('  ❌ .env.example is missing.');
    return false;
  }

  const content = readFileSync(envExamplePath, 'utf-8');
  const hasReadonly = content.includes('ALLOW_PRODUCTION_READONLY=false');
  const hasWriteFalse = content.includes('ALLOW_PRODUCTION_WRITE=false');

  console.log(`  ${hasReadonly ? '✅' : '❌'} ALLOW_PRODUCTION_READONLY=false`);
  console.log(`  ${hasWriteFalse ? '✅' : '❌'} ALLOW_PRODUCTION_WRITE=false`);

  return hasReadonly && hasWriteFalse;
}

function scanForViolations(dir: string, violations: string[]): void {
  if (!existsSync(dir)) {
    return;
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      scanForViolations(fullPath, violations);
      continue;
    }

    const extension = extname(entry.name);
    if (!['.ts', '.js', '.md', '.yml', '.yaml'].includes(extension)) {
      continue;
    }

    const content = readFileSync(fullPath, 'utf-8');

    if (
      /process\.env\.ALLOW_PRODUCTION_WRITE\s*=\s*['"]true['"]/.test(content) ||
      /\bALLOW_PRODUCTION_WRITE\b\s*:\s*true/.test(content)
    ) {
      violations.push(`${fullPath.replace(`${ROOT}/`, '')}: hardcoded ALLOW_PRODUCTION_WRITE=true`);
    }
  }
}

function main(): void {
  console.log('Production Write Safety Check');
  console.log('=============================');

  const ok = checkEnvExample();
  const violations: string[] = [];

  scanForViolations(resolve(ROOT, 'packages'), violations);
  scanForViolations(resolve(ROOT, 'scripts'), violations);
  scanForViolations(resolve(ROOT, 'templates'), violations);

  if (violations.length === 0) {
    console.log('  ✅ No obvious production write violations detected.');
  } else {
    for (const violation of violations) {
      console.log(`  ❌ ${violation}`);
    }
  }

  if (!ok || violations.length > 0) {
    process.exit(1);
  }

  console.log('');
  console.log('✅ Production write safety check PASSED.');
}

main();
