import { existsSync, readdirSync } from 'fs';
import { basename, resolve } from 'path';
import type { ProjectEnvironment } from './project-config';

export const PROJECT_CONTEXT_FILES = [
  'product-context.md',
  'frontend-context.md',
  'backend-context.md',
  'api-context.md',
  'external-systems-context.md',
  'test-scope.md',
] as const;

const PROJECT_KEY_PATTERNS = [
  /执行\s+([a-zA-Z0-9_-]+)\s+QC/i,
  /添加\s+([a-zA-Z0-9_-]+)\s+业务测试/i,
  /为\s+([a-zA-Z0-9_-]+)\s+生成\s+test\s*plan/i,
  /为\s+([a-zA-Z0-9_-]+)\s+执行/i,
  /使用本地\s+auth\s+bootstrap\s+执行\s+([a-zA-Z0-9_-]+)\s+QC/i,
  /run\s+([a-zA-Z0-9_-]+)\s+qc/i,
  /add\s+([a-zA-Z0-9_-]+)\s+business\s+tests/i,
  /generate\s+test\s+plan\s+for\s+([a-zA-Z0-9_-]+)/i,
  /projects\/([a-zA-Z0-9_-]+)\/test-plans\/reviewed\//i,
];

export function detectProjectKeyFromText(input: string): string | undefined {
  for (const pattern of PROJECT_KEY_PATTERNS) {
    const match = input.match(pattern);
    if (match?.[1]) {
      const key = match[1].replace(/[^a-zA-Z0-9_-]/g, '');
      if (key.length > 0) {
        return key;
      }
    }
  }

  return undefined;
}

export function listProjectKeys(root?: string): string[] {
  const base = root ? resolve(root) : process.cwd();
  const projectsDir = resolve(base, 'projects');

  if (!existsSync(projectsDir)) {
    return [];
  }

  return readdirSync(projectsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

export function projectExists(projectKey: string, root?: string): boolean {
  const base = root ? resolve(root) : process.cwd();
  return existsSync(resolve(base, 'projects', projectKey));
}

export function resolveProjectRoot(projectKey: string, root?: string): string {
  const base = root ? resolve(root) : process.cwd();
  return resolve(base, 'projects', projectKey);
}

export function resolveProjectConfigDir(projectKey: string, root?: string): string {
  return resolve(resolveProjectRoot(projectKey, root), 'config');
}

export function resolveProjectConfigPath(
  projectKey: string,
  env: string,
  root?: string
): string {
  return resolve(resolveProjectConfigDir(projectKey, root), `${env}.ts`);
}

export function resolveProjectConfigCandidates(
  projectKey: string,
  env: ProjectEnvironment,
  root?: string
): { kind: 'environment' | 'base'; path: string }[] {
  const configDir = resolveProjectConfigDir(projectKey, root);

  return [
    { kind: 'base', path: resolve(configDir, 'project.config.ts') },
    { kind: 'environment', path: resolve(configDir, `${env}.ts`) },
  ];
}

export function resolveContextPaths(projectKey: string, root?: string): string[] {
  const contextDir = resolve(resolveProjectRoot(projectKey, root), 'context');
  return PROJECT_CONTEXT_FILES.map((file) => resolve(contextDir, file));
}

export function getContextLabelFromPath(path: string): string {
  return basename(path, '.md');
}

export function resolveReviewedTestPlanDir(projectKey: string, root?: string): string {
  return resolve(resolveProjectRoot(projectKey, root), 'test-plans', 'reviewed');
}

export function resolveGeneratedTestPlanDir(projectKey: string, root?: string): string {
  return resolve(resolveProjectRoot(projectKey, root), 'test-plans', 'generated');
}

export function resolveTestsDir(projectKey: string, root?: string): string {
  return resolve(resolveProjectRoot(projectKey, root), 'tests');
}

export function resolveAuthStatePath(
  projectKey: string,
  env: string,
  root?: string
): string {
  const base = root ? resolve(root) : process.cwd();
  return resolve(base, '.auth', `${projectKey}-${env}.json`);
}
