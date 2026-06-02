import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import {
  createDefaultProjectConfig,
  mergeProjectConfig,
  normalizeProjectEnvironment,
  type ProjectEnvironment,
  type ProjectQCConfig,
} from './project-config';
import {
  projectExists,
  resolveProjectConfigCandidates,
  resolveProjectRoot,
} from './project-discovery';

export interface ProjectConfigDiscoverySource {
  kind: 'base' | 'environment';
  path: string;
  exists: boolean;
  loaded: boolean;
}

export interface ProjectConfigDiscoveryResult {
  exists: boolean;
  projectKey: string;
  environment: ProjectEnvironment;
  projectRoot: string;
  configDir: string;
  config: ProjectQCConfig;
  sources: ProjectConfigDiscoverySource[];
  diagnostics: string[];
}

type ConfigModuleExport =
  | Partial<ProjectQCConfig>
  | {
      default?: Partial<ProjectQCConfig>;
      config?: Partial<ProjectQCConfig>;
    };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractConfig(moduleExport: ConfigModuleExport): Partial<ProjectQCConfig> | undefined {
  if (isPlainObject(moduleExport) && 'default' in moduleExport) {
    const defaultExport = moduleExport.default;
    if (defaultExport && isPlainObject(defaultExport)) {
      return defaultExport as Partial<ProjectQCConfig>;
    }
  }

  if (isPlainObject(moduleExport) && 'config' in moduleExport) {
    const namedExport = moduleExport.config;
    if (namedExport && isPlainObject(namedExport)) {
      return namedExport as Partial<ProjectQCConfig>;
    }
  }

  if (isPlainObject(moduleExport)) {
    return moduleExport as Partial<ProjectQCConfig>;
  }

  return undefined;
}

async function importProjectConfigModule(
  path: string
): Promise<Partial<ProjectQCConfig> | undefined> {
  const moduleExport = await import(pathToFileURL(path).href);
  return extractConfig(moduleExport as ConfigModuleExport);
}

export function validateProjectConfig(config: ProjectQCConfig): string[] {
  const diagnostics: string[] = [];

  if (!config.projectKey) {
    diagnostics.push('projectKey is missing in resolved project config.');
  }

  if (config.environment === 'production-smoke') {
    if (!config.safety.readonly) {
      diagnostics.push(
        'production-smoke must set safety.readonly=true. Falling back to readonly is recommended.'
      );
    }
    if (config.safety.allowProductionWrite || config.auth.allowProductionWrite) {
      diagnostics.push(
        'production-smoke must keep allowProductionWrite=false in both auth and safety config.'
      );
    }
    if (config.safety.allowExternalWrite) {
      diagnostics.push('production-smoke must keep allowExternalWrite=false.');
    }
  }

  if (!config.context.contextDir) {
    diagnostics.push('context.contextDir is empty.');
  }

  if (!config.tests.testDir) {
    diagnostics.push('tests.testDir is empty.');
  }

  if (!config.context.testPlansReviewedDir) {
    diagnostics.push('context.testPlansReviewedDir is empty.');
  }

  if (config.unitTests.enabled) {
    const gates = config.unitTests.gates ?? [];
    const hasGates = gates.length > 0;

    if (hasGates) {
      for (const [index, gate] of gates.entries()) {
        if (!gate.name) {
          diagnostics.push(`unitTests.gates[${index}].name is empty.`);
        }
        if (!gate.command) {
          diagnostics.push(`unitTests.gates[${index}].command is empty.`);
        }
        if (!gate.workingDir) {
          diagnostics.push(`unitTests.gates[${index}].workingDir is empty.`);
        }

        if (gate.coverage?.enabled) {
          if (!gate.coverage.command) {
            diagnostics.push(`unitTests.gates[${index}].coverage.command is empty.`);
          }
          if (!gate.coverage.reportPath) {
            diagnostics.push(`unitTests.gates[${index}].coverage.reportPath is empty.`);
          }
          if (!gate.coverage.format) {
            diagnostics.push(`unitTests.gates[${index}].coverage.format is empty.`);
          }
          if (gate.coverage.moduleGroups.length === 0) {
            diagnostics.push(
              `unitTests.gates[${index}].coverage.moduleGroups must contain at least one rootDir.`
            );
          }
          for (const [groupIndex, group] of gate.coverage.moduleGroups.entries()) {
            if (!group.rootDir) {
              diagnostics.push(
                `unitTests.gates[${index}].coverage.moduleGroups[${groupIndex}].rootDir is empty.`
              );
            }
          }
        }
      }
    } else {
      if (!config.unitTests.command) {
        diagnostics.push('unitTests.command is empty while unitTests.enabled=true.');
      }

      if (!config.unitTests.workingDir) {
        diagnostics.push('unitTests.workingDir is empty while unitTests.enabled=true.');
      }
    }
  }

  if (config.orchestration.enabled) {
    for (const [index, check] of config.orchestration.environmentChecks.entries()) {
      if (!check.name) {
        diagnostics.push(`orchestration.environmentChecks[${index}].name is empty.`);
      }
      if (!check.target) {
        diagnostics.push(`orchestration.environmentChecks[${index}].target is empty.`);
      }
    }

    for (const [index, dependency] of config.orchestration.dataDependencies.entries()) {
      if (!dependency.name) {
        diagnostics.push(`orchestration.dataDependencies[${index}].name is empty.`);
      }
      if (dependency.required && !dependency.checkCommand && !dependency.provisionCommand) {
        diagnostics.push(
          `orchestration.dataDependencies[${index}] is required but has no checkCommand or provisionCommand.`
        );
      }
    }
  }

  if (config.mcp.enabled) {
    if (!config.mcp.recordDir) {
      diagnostics.push('mcp.recordDir is empty while mcp.enabled=true.');
    }
    if (!config.mcp.readonly) {
      diagnostics.push('mcp.readonly must remain true for governed exploration.');
    }
  }

  if (config.appMap.enabled) {
    for (const [index, module] of config.appMap.modules.entries()) {
      if (!module.key) {
        diagnostics.push(`appMap.modules[${index}].key is empty.`);
      }
      if (!module.displayName) {
        diagnostics.push(`appMap.modules[${index}].displayName is empty.`);
      }
    }
  }

  return diagnostics;
}

export async function discoverProjectConfig(
  projectKey: string,
  envInput?: string,
  root?: string
): Promise<ProjectConfigDiscoveryResult> {
  const baseRoot = root ? resolve(root) : process.cwd();
  const environment = normalizeProjectEnvironment(envInput);
  const projectRoot = resolveProjectRoot(projectKey, baseRoot);
  const configDir = resolve(projectRoot, 'config');
  const defaultConfig = createDefaultProjectConfig(projectKey, environment);
  const candidates = resolveProjectConfigCandidates(projectKey, environment, baseRoot);
  const sources: ProjectConfigDiscoverySource[] = candidates.map((candidate) => ({
    ...candidate,
    exists: existsSync(candidate.path),
    loaded: false,
  }));
  const diagnostics: string[] = [];
  let config = defaultConfig;

  if (!projectExists(projectKey, baseRoot)) {
    diagnostics.push(
      `Project '${projectKey}' does not exist at ${projectRoot}. Returning safe defaults only.`
    );

    return {
      exists: false,
      projectKey,
      environment,
      projectRoot,
      configDir,
      config,
      sources,
      diagnostics,
    };
  }

  for (const source of sources) {
    if (!source.exists) {
      continue;
    }

    const imported = await importProjectConfigModule(source.path);
    if (!imported) {
      diagnostics.push(`Config file exists but did not export an object: ${source.path}`);
      continue;
    }

    source.loaded = true;
    config = mergeProjectConfig(config, imported);
  }

  if (!sources.some((source) => source.loaded)) {
    diagnostics.push(
      `No project config files found for '${projectKey}'. Using safe defaults for ${environment}.`
    );
  }

  config = mergeProjectConfig(config, {
    projectKey,
    environment,
  });

  diagnostics.push(...validateProjectConfig(config));

  return {
    exists: true,
    projectKey,
    environment,
    projectRoot,
    configDir,
    config,
    sources,
    diagnostics,
  };
}

export function formatProjectConfigDiscovery(
  result: ProjectConfigDiscoveryResult
): string {
  const lines: string[] = [];
  lines.push('Project Config Discovery:');
  lines.push(`  Project: ${result.projectKey}`);
  lines.push(`  Environment: ${result.environment}`);
  lines.push(`  Project Root: ${result.projectRoot}`);
  lines.push(`  Config Dir: ${result.configDir}`);
  lines.push('  Sources:');

  for (const source of result.sources) {
    const status = source.loaded
      ? 'loaded'
      : source.exists
        ? 'present-not-loaded'
        : 'missing';
    lines.push(`    - [${source.kind}] ${status}: ${source.path}`);
  }

  if (result.diagnostics.length > 0) {
    lines.push('  Diagnostics:');
    for (const diagnostic of result.diagnostics) {
      lines.push(`    - ${diagnostic}`);
    }
  }

  return lines.join('\n');
}
