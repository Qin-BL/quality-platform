import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * check-spec-layering.ts
 *
 * Scans projects tests directories for .spec.ts files and checks layering:
 * 1. Spec files should not be excessively long (>200 lines is suspicious)
 * 2. Spec files should not contain complex business logic signs:
 *    - Direct fetch() calls
 *    - Inline API URLs
 *    - Long inline selectors
 *    - Complex data construction
 *
 * Phase 1: Warning-only mode. No business projects — passes normally.
 * When business tests exist, this provides recommendations.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROJECTS_DIR = resolve(ROOT, 'projects');

const MAX_SPEC_LINES = 200;

function findSpecFiles(): { project: string; path: string }[] {
  const results: { project: string; path: string }[] = [];
  if (!existsSync(PROJECTS_DIR)) return results;

  const projectDirs = readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);

  for (const project of projectDirs) {
    const testsDir = resolve(PROJECTS_DIR, project, 'tests');
    if (!existsSync(testsDir)) continue;
    findRecursive(testsDir, project, results);
  }

  return results;
}

function findRecursive(
  dir: string,
  project: string,
  results: { project: string; path: string }[]
): void {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      findRecursive(fullPath, project, results);
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      results.push({ project, path: fullPath });
    }
  }
}

interface SpecWarning {
  file: string;
  issue: string;
}

function checkSpec(filePath: string, relativePath: string): SpecWarning[] {
  const warnings: SpecWarning[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Check 1: excessive length
  if (lines.length > MAX_SPEC_LINES) {
    warnings.push({
      file: relativePath,
      issue: `Long spec file (${lines.length} lines > ${MAX_SPEC_LINES}). Consider splitting or moving logic to pages/clients/fixtures/assertions.`,
    });
  }

  // Check 2: direct fetch() calls
  const fetchCount = (content.match(/fetch\s*\(/g) || []).length;
  if (fetchCount > 2) {
    warnings.push({
      file: relativePath,
      issue: `${fetchCount} direct fetch() calls in spec. Move API calls to packages/clients/.`,
    });
  }

  // Check 3: inline API URLs
  if (content.includes('http://') || content.includes('https://')) {
    warnings.push({
      file: relativePath,
      issue: 'Hardcoded URLs in spec. Use environment variables via packages/clients/.',
    });
  }

  // Check 4: complex inline selectors (XPath, long CSS chains)
  const longSelectorCount = (content.match(/\.locator\(['"][^'"]{80,}['"]\)/g) || []).length;
  if (longSelectorCount > 0) {
    warnings.push({
      file: relativePath,
      issue: `${longSelectorCount} very long inline selector(s). Move to page objects in packages/pages/.`,
    });
  }

  // Check 5: complex inline data construction
  const objectLiteralCount = (content.match(/\{[^}]*id\s*:/g) || []).length;
  if (objectLiteralCount > 3) {
    warnings.push({
      file: relativePath,
      issue: `${objectLiteralCount} inline data objects. Move to packages/fixtures/.`,
    });
  }

  return warnings;
}

function main(): void {
  console.log('Spec Layering Check');
  console.log('===================');

  const specFiles = findSpecFiles();

  if (specFiles.length === 0) {
    console.log('No spec files found — Phase 1, no business tests.');
    console.log('No layering issues to report.');
    process.exit(0);
  }

  console.log(`Checking ${specFiles.length} spec file(s)...`);
  let totalWarnings = 0;

  for (const { project, path: filePath } of specFiles) {
    const relativePath = filePath.replace(ROOT + '/', '');
    const warnings = checkSpec(filePath, relativePath);

    if (warnings.length > 0) {
      console.log(`\n  ${project} / ${relativePath}:`);
      for (const w of warnings) {
        console.log(`    ⚠️  ${w.issue}`);
        totalWarnings++;
      }
    }
  }

  console.log('');

  if (totalWarnings === 0) {
    console.log('✅ All spec files pass layering checks.');
  } else {
    console.log(`⚠️  ${totalWarnings} layering warning(s) found.`);
    console.log('These are recommendations:');
    console.log('  - UI actions → packages/pages/');
    console.log('  - API calls → packages/clients/');
    console.log('  - Test data → packages/fixtures/');
    console.log('  - Business assertions → packages/assertions/');
    console.log('');
    console.log('Phase 1 note: Warnings only. No strict blocking yet.');
  }

  process.exit(0); // Always pass in Phase 1 — warnings only
}

main();