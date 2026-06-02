import type { DevWorkspaceTaskBundle, DevWorkspaceRepoTaskBundle } from './task-bundle.ts';

export interface DevWorkspaceRepoWorkOrder {
  repoKey: string;
  repoName: string;
  repoPath: string;
  branch: string;
  summary: string;
  promptPath: string;
  jsonPath: string;
  readyForAgentExecution: boolean;
  manualBlockers: string[];
  suggestedOutputs: string[];
}

export interface DevWorkspaceWorkOrderPacket {
  generatedAt: string;
  workspaceKey: string;
  workspaceName: string;
  featureName: string;
  objective?: string;
  outputDirectoryName: string;
  repos: DevWorkspaceRepoWorkOrder[];
}

export interface RepoPromptArtifact {
  repoKey: string;
  repoName: string;
  repoPath: string;
  branch: string;
  prompt: string;
  suggestedOutputs: string[];
  manualBlockers: string[];
}

function detectManualBlockers(
  repo: DevWorkspaceRepoTaskBundle
): string[] {
  const blockers: string[] = [];
  if (repo.executionStepIds.length === 0) {
    blockers.push('No execution steps were generated for this repo.');
  }
  if (repo.deployNotes.some((note) => note.includes('No checked-in deployment target'))) {
    blockers.push('Deployment path is not fully codified in source control.');
  }
  return blockers;
}

function buildSuggestedOutputs(
  repo: DevWorkspaceRepoTaskBundle
): string[] {
  return [
    `Repo-scoped implementation patch for ${repo.repoName}`,
    `Verification notes for ${repo.repoName}`,
    `Promotion/deployment handoff notes for ${repo.repoName}`,
  ];
}

function repoWorkOrder(
  repo: DevWorkspaceRepoTaskBundle,
  outputDirectoryName: string
): DevWorkspaceRepoWorkOrder {
  const manualBlockers = detectManualBlockers(repo);
  const suggestedOutputs = buildSuggestedOutputs(repo);

  return {
    repoKey: repo.repoKey,
    repoName: repo.repoName,
    repoPath: repo.repoPath,
    branch: repo.branch,
    summary: repo.summary,
    promptPath: `${outputDirectoryName}/${repo.repoKey}.prompt.txt`,
    jsonPath: `${outputDirectoryName}/${repo.repoKey}.json`,
    readyForAgentExecution: manualBlockers.length === 0,
    manualBlockers,
    suggestedOutputs,
  };
}

export function buildWorkOrderPacket(
  bundle: DevWorkspaceTaskBundle,
  outputDirectoryName: string
): {
  packet: DevWorkspaceWorkOrderPacket;
  repoArtifacts: RepoPromptArtifact[];
} {
  const repoArtifacts: RepoPromptArtifact[] = bundle.repos.map((repo) => {
    const manualBlockers = detectManualBlockers(repo);
    return {
      repoKey: repo.repoKey,
      repoName: repo.repoName,
      repoPath: repo.repoPath,
      branch: repo.branch,
      prompt: repo.agentPrompt,
      suggestedOutputs: buildSuggestedOutputs(repo),
      manualBlockers,
    };
  });

  const packet: DevWorkspaceWorkOrderPacket = {
    generatedAt: new Date().toISOString(),
    workspaceKey: bundle.workspaceKey,
    workspaceName: bundle.workspaceName,
    featureName: bundle.featureName,
    objective: bundle.objective,
    outputDirectoryName,
    repos: bundle.repos.map((repo) => repoWorkOrder(repo, outputDirectoryName)),
  };

  return { packet, repoArtifacts };
}
