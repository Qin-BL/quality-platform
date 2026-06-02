import { existsSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { ProjectAppMapConfig, ProjectAppMapModuleConfig } from './project-config';

export interface AppMapModuleCoverage {
  key: string;
  displayName: string;
  kind: ProjectAppMapModuleConfig['kind'];
  critical: boolean;
  matchingTests: string[];
  matchingPlans: string[];
  covered: boolean;
}

export interface AppMapCoverageSummary {
  enabled: boolean;
  totalModules: number;
  coveredModules: number;
  uncoveredModules: number;
  modules: AppMapModuleCoverage[];
}

function collectFiles(dir: string, matcher: (path: string) => boolean): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectFiles(entryPath, matcher));
      continue;
    }
    if (matcher(entryPath)) {
      result.push(entryPath);
    }
  }

  return result;
}

function toNeedles(module: ProjectAppMapModuleConfig): string[] {
  return [
    module.key,
    module.displayName,
    ...module.aliases,
    ...module.routes,
    ...module.apiPatterns,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.toLowerCase());
}

function matchEvidence(filePath: string, needles: string[]): boolean {
  const lowerPath = filePath.toLowerCase();
  const contents = readFileSync(filePath, 'utf-8').toLowerCase();
  return needles.some((needle) => lowerPath.includes(needle) || contents.includes(needle));
}

export function buildAppMapCoverageSummary(
  appMap: ProjectAppMapConfig,
  testsDir: string,
  reviewedPlansDir: string,
  root?: string
): AppMapCoverageSummary {
  if (!appMap.enabled) {
    return {
      enabled: false,
      totalModules: 0,
      coveredModules: 0,
      uncoveredModules: 0,
      modules: [],
    };
  }

  const base = root ? resolve(root) : process.cwd();
  const testFiles = collectFiles(resolve(base, testsDir), (path) => path.endsWith('.ts'));
  const reviewedPlanFiles = collectFiles(resolve(base, reviewedPlansDir), (path) =>
    path.endsWith('.md')
  );

  const modules = appMap.modules.map((module) => {
    const needles = toNeedles(module);
    const matchingTests = testFiles.filter((file) => matchEvidence(file, needles));
    const matchingPlans = reviewedPlanFiles.filter((file) => matchEvidence(file, needles));

    return {
      key: module.key,
      displayName: module.displayName,
      kind: module.kind,
      critical: module.critical,
      matchingTests,
      matchingPlans,
      covered: matchingTests.length > 0 || matchingPlans.length > 0,
    };
  });

  const coveredModules = modules.filter((module) => module.covered).length;

  return {
    enabled: true,
    totalModules: modules.length,
    coveredModules,
    uncoveredModules: modules.length - coveredModules,
    modules,
  };
}
