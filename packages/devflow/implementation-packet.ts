import { spawnSync } from 'child_process';
import type { DevWorkspaceTaskBundle } from './task-bundle.ts';
import type { DevWorkspaceWorkOrderPacket } from './work-order.ts';

export interface DevWorkspaceSurfaceFileTargets {
  surfaceKey: string;
  surfaceLabel: string;
  candidateFiles: string[];
}

export interface RepoSurfaceDeclaration {
  surfaceKey: string;
  surfaceLabel: string;
  paths: string[];
}

export interface DevWorkspaceRepoImplementationPacket {
  repoKey: string;
  repoName: string;
  repoPath: string;
  branch: string;
  objective?: string;
  summary: string;
  readyForDrafting: boolean;
  manualBlockers: string[];
  qualityGateCommands: string[];
  deployNotes: string[];
  candidateTargets: DevWorkspaceSurfaceFileTargets[];
  patchPlanTemplate: string;
  executionPrompt: string;
}

export interface DevWorkspaceImplementationPacketBundle {
  generatedAt: string;
  workspaceKey: string;
  workspaceName: string;
  featureName: string;
  objective?: string;
  repos: DevWorkspaceRepoImplementationPacket[];
}

interface PatchPlanContext {
  repoName: string;
  repoPath: string;
  branch: string;
  objective?: string;
  summary: string;
  qualityGateCommands: string[];
  deployNotes: string[];
  manualBlockers: string[];
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

function scoreCandidateFile(filePath: string): number {
  let score = 0;

  const normalized = filePath.replace(/\\/g, '/');
  const lower = normalized.toLowerCase();

  if (lower.endsWith('/__init__.py')) {
    score -= 10;
  }

  if (lower.includes('/tests/') || lower.includes('/test/')) {
    score -= 2;
  }

  if (lower.includes('/migrations/')) {
    score -= 1;
  }

  if (/\.(tsx?|jsx?)$/.test(lower)) {
    score += 4;
  } else if (/\.(py|go)$/.test(lower)) {
    score += 4;
  } else if (/\.(ya?ml|json)$/.test(lower)) {
    score += 2;
  } else if (/docker-compose/.test(lower)) {
    score += 2;
  } else if (/\.(md|txt)$/.test(lower)) {
    score -= 1;
  }

  const depth = normalized.split('/').length;
  score += Math.max(0, 8 - depth);

  return score;
}

function selectCandidateFiles(files: string[], limit: number): string[] {
  return uniqueValues(files)
    .sort((left, right) => {
      const scoreDelta = scoreCandidateFile(right) - scoreCandidateFile(left);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return left.localeCompare(right);
    })
    .slice(0, limit);
}

function gitLsFiles(repoPath: string, paths: string[]): string[] {
  const result = spawnSync('git', ['ls-files', ...paths], {
    cwd: repoPath,
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildPatchPlanTemplate(
  context: PatchPlanContext,
  candidateTargets: DevWorkspaceSurfaceFileTargets[]
): string {
  const lines: string[] = [];
  lines.push(`# Patch Plan Template — ${context.repoName}`);
  lines.push('');
  lines.push(`- Repo path: \`${context.repoPath}\``);
  lines.push(`- Branch: \`${context.branch}\``);
  lines.push(`- Feature: \`${context.summary}\``);
  if (context.objective) {
    lines.push(`- Objective: ${context.objective}`);
  }
  lines.push('');
  lines.push('## Intended Change Set');
  lines.push('');
  lines.push('- Primary files to touch:');
  for (const surface of candidateTargets) {
    const preview =
      surface.candidateFiles.length > 0
        ? surface.candidateFiles.slice(0, 5).map((file) => `\`${file}\``).join(', ')
        : 'TBD';
    lines.push(`  - ${surface.surfaceLabel}: ${preview}`);
  }
  lines.push('- New files expected: TBD');
  lines.push('- Data / API / contract impact: TBD');
  lines.push('');
  lines.push('## Verification');
  lines.push('');
  for (const command of context.qualityGateCommands) {
    lines.push(`- \`${command}\``);
  }
  if (context.qualityGateCommands.length === 0) {
    lines.push('- No declared quality gates.');
  }
  lines.push('');
  lines.push('## Manual Blockers');
  lines.push('');
  if (context.manualBlockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of context.manualBlockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  for (const note of context.deployNotes) {
    lines.push(`- ${note}`);
  }
  return `${lines.join('\n')}\n`;
}

function findManualBlockers(
  workOrders: DevWorkspaceWorkOrderPacket,
  repoKey: string
): string[] {
  const repo = workOrders.repos.find((item) => item.repoKey === repoKey);
  if (!repo) {
    throw new Error(`Missing work order for repo: ${repoKey}`);
  }
  return repo.manualBlockers;
}

export function buildImplementationPackets(
  bundle: DevWorkspaceTaskBundle,
  workOrders: DevWorkspaceWorkOrderPacket,
  repoSurfacePaths: Record<string, RepoSurfaceDeclaration[]>
): DevWorkspaceImplementationPacketBundle {
  const repos = bundle.repos.map((repo) => {
    const manualBlockers = findManualBlockers(workOrders, repo.repoKey);
    const declaredSurfaces = repoSurfacePaths[repo.repoKey] || [];
    const candidateTargets = declaredSurfaces.map((surface) => ({
      surfaceKey: surface.surfaceKey,
      surfaceLabel: surface.surfaceLabel,
      candidateFiles: selectCandidateFiles(
        gitLsFiles(repo.repoPath, surface.paths),
        12
      ),
    }));

    return {
      repoKey: repo.repoKey,
      repoName: repo.repoName,
      repoPath: repo.repoPath,
      branch: repo.branch,
      objective: repo.objective,
      summary: repo.summary,
      readyForDrafting: manualBlockers.length === 0,
      manualBlockers,
      qualityGateCommands: repo.qualityGateCommands,
      deployNotes: repo.deployNotes,
      candidateTargets,
      patchPlanTemplate: buildPatchPlanTemplate(
        {
          repoName: repo.repoName,
          repoPath: repo.repoPath,
          branch: repo.branch,
          objective: repo.objective,
          summary: repo.summary,
          qualityGateCommands: repo.qualityGateCommands,
          deployNotes: repo.deployNotes,
          manualBlockers,
        },
        candidateTargets
      ),
      executionPrompt: repo.agentPrompt,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    workspaceKey: bundle.workspaceKey,
    workspaceName: bundle.workspaceName,
    featureName: bundle.featureName,
    objective: bundle.objective,
    repos,
  };
}
