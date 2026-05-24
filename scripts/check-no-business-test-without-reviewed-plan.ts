import { readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * check-no-business-test-without-reviewed-plan.ts
 *
 * Stricter version of check-test-plan-required.ts.
 * Checks: no formal test directory can exist without a reviewed test plan.
 * Does NOT block temporary/exploratory tests in generated area.
 *
 * Phase 1: No business projects yet — passes normally.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROJECTS_DIR = resolve(ROOT, 'projects');

function findTestFilesInDir(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTestFilesInDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

function hasReviewedPlan(project: string): boolean {
  const reviewedDir = resolve(PROJECTS_DIR, project, 'test-plans', 'reviewed');
  if (!existsSync(reviewedDir)) return false;
  return readdirSync(reviewedDir).filter((f) => !f.startsWith('.')).length > 0;
}

function main(): void {
  console.log('Business Test Without Reviewed Plan Check');
  console.log('==========================================');

  if (!existsSync(PROJECTS_DIR)) {
    console.log('No projects directory. Phase 1 — passing.');
    process.exit(0);
  }

  const projectDirs = readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);

  if (projectDirs.length === 0) {
    console.log('No project directories. Phase 1 — passing.');
    process.exit(0);
  }

  let violations = 0;

  for (const project of projectDirs) {
    const testsDir = resolve(PROJECTS_DIR, project, 'tests');
    const testFiles = findTestFilesInDir(testsDir);

    if (testFiles.length === 0) {
      console.log(`  ${project}: no test files — OK`);
      continue;
    }

    const reviewed = hasReviewedPlan(project);

    if (reviewed) {
      console.log(`  ${project}: ${testFiles.length} test(s), reviewed plan exists — OK`);
    } else {
      console.log(`  ${project}: ${testFiles.length} test(s), NO reviewed plan — VIOLATION`);
      violations += testFiles.length;
    }
  }

  console.log('');

  if (violations > 0) {
    console.log(`FAILED: ${violations} test file(s) without reviewed test plan.`);
    console.log('All formal tests require a reviewed test plan.');
    console.log('Generate: test plan draft → review → generate tests.');
    process.exit(1);
  }

  console.log('PASSED: all tests have reviewed plans (or no projects exist).');
}

main();