/**
 * check-test-plan-required.ts — Verifies that projects with tests have reviewed test plans.
 *
 * Scans projects tests directories for .spec.ts files.
 * If tests exist but no reviewed test plan, reports error.
 * Allows temporary/exploratory tests with temporary or exploratory tags, outputs warning.
 *
 * Phase 1: No business projects — should pass normally.
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROJECTS_DIR = resolve(ROOT, 'projects');

interface TestFile {
  project: string;
  path: string;
  isTemporary: boolean;
}

function findSpecFiles(): TestFile[] {
  const results: TestFile[] = [];

  if (!existsSync(PROJECTS_DIR)) return results;

  const projectDirs = readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '.gitkeep')
    .map((d) => d.name);

  for (const project of projectDirs) {
    const testsDir = resolve(PROJECTS_DIR, project, 'tests');
    if (!existsSync(testsDir)) continue;
    findSpecFilesRecursive(testsDir, project, results);
  }

  return results;
}

function findSpecFilesRecursive(dir: string, project: string, results: TestFile[]): void {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      findSpecFilesRecursive(fullPath, project, results);
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      const content = readFileSync(fullPath, 'utf-8');
      const isTemporary =
        content.includes('@temporary') ||
        content.includes('@exploratory') ||
        content.includes('TEMP:') ||
        content.includes('EXPLORATORY:');
      results.push({ project, path: fullPath, isTemporary });
    }
  }
}

function hasReviewedTestPlan(project: string): boolean {
  const reviewedDir = resolve(PROJECTS_DIR, project, 'test-plans', 'reviewed');
  if (!existsSync(reviewedDir)) return false;

  const files = readdirSync(reviewedDir).filter((f) => !f.startsWith('.'));
  return files.length > 0;
}

function main(): void {
  console.log('Test Plan Required Check');
  console.log('========================');

  const specFiles = findSpecFiles();

  if (specFiles.length === 0) {
    console.log('✅ No test files found — no projects yet (Phase 1).');
    console.log('   This is expected. No business tests exist.');
    process.exit(0);
  }

  console.log(`Found ${specFiles.length} test file(s):`);

  const projects = new Set(specFiles.map((f) => f.project));
  let errors = 0;
  let warnings = 0;

  for (const project of projects) {
    const projectFiles = specFiles.filter((f) => f.project === project);
    const permanent = projectFiles.filter((f) => !f.isTemporary);
    const temporary = projectFiles.filter((f) => f.isTemporary);
    const reviewed = hasReviewedTestPlan(project);

    console.log(`\n  Project: ${project}`);
    console.log(`    Tests: ${projectFiles.length} (${permanent.length} permanent, ${temporary.length} temporary)`);

    if (reviewed) {
      console.log(`    ✅ Reviewed test plan exists.`);
    } else {
      if (permanent.length > 0) {
        console.log(`    ❌ NO reviewed test plan, but ${permanent.length} permanent test(s) exist.`);
        console.log(`       These tests should not exist without a reviewed plan.`);
        console.log(`       Create a reviewed plan or mark these as temporary.`);
        errors++;
      } else {
        console.log(`    ⚠️  No reviewed test plan. Temporary tests only — this is allowed but review is needed.`);
        warnings++;
      }
    }
  }

  console.log('');

  if (errors > 0) {
    console.log(`❌ FAILED — ${errors} error(s), ${warnings} warning(s).`);
    console.log('   Permanent tests require a reviewed test plan.');
    console.log('   Generate a test plan → review → then generate tests.');
    process.exit(1);
  }

  if (warnings > 0) {
    console.log(`✅ PASSED with warnings — ${warnings} temporary test(s) without reviewed plan.`);
    console.log('   Temporary tests are allowed. Review is recommended before promotion.');
    process.exit(0);
  }

  console.log('✅ PASSED — all projects with permanent tests have reviewed test plans.');
}

main();