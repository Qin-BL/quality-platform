import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import type { ProjectMCPConfig } from '../project/project-config';

export interface MCPExplorationRun {
  id: string;
  projectKey: string;
  environment: string;
  request: string;
  sessionName: string;
  readonly: boolean;
  baseUrl: string;
  allowedDomains: string[];
  artifactDir: string;
  manifestPath: string;
  status: 'prepared' | 'running' | 'completed';
  nextActions: string[];
  createdAt: string;
}

export function createMCPExplorationRun(
  projectKey: string,
  environment: string,
  request: string,
  config: ProjectMCPConfig,
  root?: string
): MCPExplorationRun {
  const base = root ? resolve(root) : process.cwd();
  const id = `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const artifactDir = resolve(base, config.recordDir, projectKey, environment, id);
  const manifestPath = resolve(artifactDir, 'exploration-manifest.json');

  return {
    id,
    projectKey,
    environment,
    request,
    sessionName: config.defaultSessionName || `Explore ${projectKey}`,
    readonly: config.readonly,
    baseUrl: config.baseUrl,
    allowedDomains: config.allowedDomains,
    artifactDir,
    manifestPath,
    status: 'prepared',
    nextActions: [
      'Open the target in the browser exploration surface.',
      'Capture route, visible state, and relevant readonly evidence.',
      'Record findings back into reviewed planning or explicit exploratory notes.',
      'Do not convert exploration findings into final business assertions without reviewed governance.',
    ],
    createdAt: new Date().toISOString(),
  };
}

export function writeMCPExplorationManifest(run: MCPExplorationRun): string {
  const outputDir = dirname(run.manifestPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(run.manifestPath, `${JSON.stringify(run, null, 2)}\n`, 'utf-8');
  return run.manifestPath;
}
