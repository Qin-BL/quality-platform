import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type {
  DevWorkspaceConfig,
  ResolvedDevWorkspaceConfig,
} from './workspace-config.ts';

export interface DevWorkspaceDiscoveryResult {
  exists: boolean;
  workspaceKey: string;
  workspaceConfigPath: string;
  diagnostics: string[];
  config?: ResolvedDevWorkspaceConfig;
}

type ConfigModuleExport =
  | DevWorkspaceConfig
  | {
      default?: DevWorkspaceConfig;
      config?: DevWorkspaceConfig;
    };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractConfig(moduleExport: ConfigModuleExport): DevWorkspaceConfig | undefined {
  if (isPlainObject(moduleExport) && 'default' in moduleExport) {
    const value = moduleExport.default;
    if (value && isPlainObject(value)) {
      return value as DevWorkspaceConfig;
    }
  }

  if (isPlainObject(moduleExport) && 'config' in moduleExport) {
    const value = moduleExport.config;
    if (value && isPlainObject(value)) {
      return value as DevWorkspaceConfig;
    }
  }

  if (isPlainObject(moduleExport)) {
    return moduleExport as DevWorkspaceConfig;
  }

  return undefined;
}

async function importWorkspaceConfigModule(
  configPath: string
): Promise<DevWorkspaceConfig | undefined> {
  const moduleExport = await import(pathToFileURL(configPath).href);
  return extractConfig(moduleExport as ConfigModuleExport);
}

function getAncestorChain(start: string): string[] {
  const chain: string[] = [];
  let current = resolve(start);

  while (true) {
    chain.push(current);
    const parent = resolve(current, '..');
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return chain;
}

function detectWorkspaceHome(
  repoPaths: string[],
  root: string
): string | undefined {
  const ancestors = getAncestorChain(root);

  for (const candidate of ancestors) {
    const allPresent = repoPaths.every((repoPath) =>
      existsSync(resolve(candidate, repoPath))
    );
    if (allPresent) {
      return candidate;
    }
  }

  return undefined;
}

function validateWorkspaceConfig(
  config: DevWorkspaceConfig,
  workspaceHome?: string
): string[] {
  const diagnostics: string[] = [];

  if (!config.workspaceKey.trim()) {
    diagnostics.push('workspaceKey is required.');
  }

  if (!config.displayName.trim()) {
    diagnostics.push('displayName is required.');
  }

  if (config.repos.length === 0) {
    diagnostics.push('At least one repository must be declared.');
  }

  const repoKeys = new Set<string>();
  for (const repo of config.repos) {
    if (repoKeys.has(repo.key)) {
      diagnostics.push(`Duplicate repo key: ${repo.key}`);
    }
    repoKeys.add(repo.key);

    if (!repo.repoPath.trim()) {
      diagnostics.push(`Repo '${repo.key}' is missing repoPath.`);
    }

    if (!repo.defaultBranch.trim()) {
      diagnostics.push(`Repo '${repo.key}' is missing defaultBranch.`);
    }

    if (!repo.featureBranchPrefix.trim()) {
      diagnostics.push(`Repo '${repo.key}' is missing featureBranchPrefix.`);
    }

    if (workspaceHome && repo.repoPath) {
      const repoRoot = resolve(workspaceHome, repo.repoPath);
      if (!existsSync(repoRoot)) {
        diagnostics.push(
          `Repo '${repo.key}' resolved path does not exist from workspace home: ${repoRoot}`
        );
      }
    }
  }

  if (!repoKeys.has(config.frameworkRepoKey)) {
    diagnostics.push(
      `frameworkRepoKey '${config.frameworkRepoKey}' does not match any repo entry.`
    );
  }

  return diagnostics;
}

export async function discoverDevWorkspace(
  workspaceKey: string,
  root?: string
): Promise<DevWorkspaceDiscoveryResult> {
  const repoRoot = root ? resolve(root) : process.cwd();
  const workspaceConfigPath = resolve(
    repoRoot,
    'workspaces',
    workspaceKey,
    'workspace.config.ts'
  );
  const diagnostics: string[] = [];

  if (!existsSync(workspaceConfigPath)) {
    diagnostics.push(`Workspace config not found: ${workspaceConfigPath}`);
    return {
      exists: false,
      workspaceKey,
      workspaceConfigPath,
      diagnostics,
    };
  }

  const config = await importWorkspaceConfigModule(workspaceConfigPath);
  if (!config) {
    diagnostics.push(`Workspace config could not be parsed: ${workspaceConfigPath}`);
    return {
      exists: true,
      workspaceKey,
      workspaceConfigPath,
      diagnostics,
    };
  }

  const workspaceHome = detectWorkspaceHome(
    config.repos.map((repo) => repo.repoPath),
    repoRoot
  );

  if (!workspaceHome) {
    diagnostics.push(
      'Unable to detect a shared workspace home that contains all declared repositories.'
    );
  }

  diagnostics.push(...validateWorkspaceConfig(config, workspaceHome));

  const resolvedConfig: ResolvedDevWorkspaceConfig = {
    ...config,
    workspaceRoot: workspaceHome || repoRoot,
    absoluteSharedPlanPath: config.sharedPlanPath
      ? resolve(workspaceHome || repoRoot, config.sharedPlanPath)
      : undefined,
    absoluteFrameworkMirrorPath: config.frameworkMirror
      ? resolve(workspaceHome || repoRoot, config.frameworkMirror.mirrorPath)
      : undefined,
    repos: config.repos.map((repo) => ({
      ...repo,
      absoluteRepoPath: resolve(workspaceHome || repoRoot, repo.repoPath),
    })),
  };

  return {
    exists: true,
    workspaceKey,
    workspaceConfigPath,
    diagnostics,
    config: resolvedConfig,
  };
}

export function formatDevWorkspaceDiscovery(
  result: DevWorkspaceDiscoveryResult
): string {
  const lines: string[] = [];
  lines.push('Dev Workspace Discovery:');
  lines.push(`  Workspace: ${result.workspaceKey}`);
  lines.push(`  Config: ${result.workspaceConfigPath}`);

  if (result.config) {
    lines.push(`  Workspace Root: ${result.config.workspaceRoot}`);
    lines.push('  Repositories:');
    for (const repo of result.config.repos) {
      lines.push(
        `    - ${repo.key}: ${repo.absoluteRepoPath} (base=${repo.integrationBranch || repo.defaultBranch})`
      );
    }
  }

  if (result.diagnostics.length > 0) {
    lines.push('  Diagnostics:');
    for (const item of result.diagnostics) {
      lines.push(`    - ${item}`);
    }
  }

  return lines.join('\n');
}
