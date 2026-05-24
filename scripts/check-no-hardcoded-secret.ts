import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DETECTION_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'api_key', pattern: /api_?key\s*[:=]\s*['"][^'"]{6,}['"]/i },
  { name: 'token', pattern: /token\s*[:=]\s*['"][^'"]{6,}['"]/i },
  { name: 'password', pattern: /password\s*[:=]\s*['"][^'"]{3,}['"]/i },
  { name: 'secret', pattern: /secret\s*[:=]\s*['"][^'"]{6,}['"]/i },
  { name: 'bearer', pattern: /Authorization\s*:\s*['"]Bearer\s+[A-Za-z0-9._-]{8,}['"]/i },
  { name: 'private_key', pattern: /private_?key\s*[:=]\s*['"][\s\S]{0,20}BEGIN/i },
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'allure-results',
  'allure-report',
  'playwright-report',
  'test-results',
]);

const PLACEHOLDER_VALUES = [
  '__PROJECT_KEY__',
  '<your-test-email>',
  '<your-test-password>',
  'Bearer <token>',
];

function scanDir(dir: string, violations: string[]): void {
  if (!existsSync(dir)) {
    return;
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') {
      continue;
    }
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath, violations);
      continue;
    }

    const extension = extname(entry.name);
    if (!['.ts', '.js', '.json', '.yml', '.yaml'].includes(extension)) {
      continue;
    }

    if (entry.name === '.env.example') {
      continue;
    }

    const content = readFileSync(fullPath, 'utf-8');
    if (PLACEHOLDER_VALUES.some((placeholder) => content.includes(placeholder))) {
      continue;
    }

    for (const pattern of DETECTION_PATTERNS) {
      if (pattern.pattern.test(content)) {
        violations.push(`${fullPath.replace(`${ROOT}/`, '')}: possible hardcoded ${pattern.name}`);
        break;
      }
    }
  }
}

function main(): void {
  console.log('Hardcoded Secret Check');
  console.log('======================');

  const violations: string[] = [];
  scanDir(ROOT, violations);

  if (violations.length === 0) {
    console.log('✅ No hardcoded secrets detected.');
    return;
  }

  for (const violation of violations) {
    console.log(`  ❌ ${violation}`);
  }

  process.exit(1);
}

main();
