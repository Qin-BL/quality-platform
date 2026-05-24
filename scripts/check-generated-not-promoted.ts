import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * check-generated-not-promoted.ts
 *
 * Checks:
 * 1. test-assets/promoted/ files should NOT contain @temporary or @generated markers
 * 2. test-assets/promoted/ should have a source reference (reviewed plan reference)
 *
 * Phase 1: No assets yet — passes normally.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROMOTED_DIR = resolve(ROOT, 'test-assets', 'promoted');

function checkPromotedDir(): { violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(PROMOTED_DIR)) return { violations, warnings };

  const entries = readdirSync(PROMOTED_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === '.gitkeep') continue;
    const fullPath = resolve(PROMOTED_DIR, entry.name);

    if (entry.isFile() && entry.name.endsWith('.ts')) {
      const content = readFileSync(fullPath, 'utf-8');

      // Check for temporary/generated markers
      if (content.includes('@temporary') || content.includes('@exploratory')) {
        violations.push(
          `${entry.name}: contains temporary/exploratory marker in promoted area`
        );
      }

      // Check for generated marker without review reference
      if (content.includes('@generated') && !content.includes('@reviewed')) {
        violations.push(
          `${entry.name}: marked as generated but not reviewed in promoted area`
        );
      }

      // Check for reviewed plan reference (encouraged, not required)
      if (!content.includes('reviewed') && !content.includes('test-plan')) {
        warnings.push(
          `${entry.name}: no reviewed test plan reference found (recommended)`
        );
      }
    }
  }

  return { violations, warnings };
}

function main(): void {
  console.log('Generated-Not-Promoted Check');
  console.log('==============================');

  if (!existsSync(PROMOTED_DIR)) {
    console.log('No promoted directory — Phase 1, passing.');
    process.exit(0);
  }

  const { violations, warnings } = checkPromotedDir();

  if (violations.length > 0) {
    console.log('VIOLATIONS:');
    for (const v of violations) {
      console.log(`  ❌ ${v}`);
    }
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
    for (const w of warnings) {
      console.log(`  ⚠️  ${w}`);
    }
  }

  if (violations.length === 0 && warnings.length === 0) {
    console.log('✅ No promoted assets or all promoted assets are clean.');
    process.exit(0);
  }

  console.log('');

  if (violations.length > 0) {
    console.log('❌ FAILED — promoted assets must not contain generated-only markers.');
    console.log('   Generated tests must be reviewed before promotion.');
    process.exit(1);
  }

  console.log('✅ PASSED with warnings — review recommendations above.');
}

main();