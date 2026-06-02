import type {
  DevWorkspaceChangeProposal,
  DevWorkspaceRepoProposal,
} from './change-proposal.ts';
import type {
  DevWorkspaceExecutionManifest,
  DevWorkspaceExecutionStep,
} from './execution-manifest.ts';

export interface DevWorkspaceRepoTaskBundle {
  repoKey: string;
  repoName: string;
  repoPath: string;
  branch: string;
  runtime: DevWorkspaceRepoProposal['runtime'];
  language: DevWorkspaceRepoProposal['language'];
  objective?: string;
  summary: string;
  whyThisRepo: string;
  changeSurfaceKeys: string[];
  taskIds: string[];
  qualityGateCommands: string[];
  executionStepIds: string[];
  deployNotes: string[];
  agentPrompt: string;
}

export interface DevWorkspaceTaskBundle {
  generatedAt: string;
  workspaceKey: string;
  workspaceName: string;
  featureName: string;
  objective?: string;
  repos: DevWorkspaceRepoTaskBundle[];
}

function findRepoExecutionSteps(
  manifest: DevWorkspaceExecutionManifest,
  repoKey: string
): DevWorkspaceExecutionStep[] {
  return manifest.steps.filter((step) => step.repoKey === repoKey);
}

function buildAgentPrompt(
  proposal: DevWorkspaceChangeProposal,
  repo: DevWorkspaceRepoProposal,
  executionSteps: DevWorkspaceExecutionStep[]
): string {
  const lines: string[] = [];
  lines.push(`Workspace: ${proposal.workspaceName} (${proposal.workspaceKey})`);
  lines.push(`Feature: ${proposal.featureName}`);
  if (proposal.objective) {
    lines.push(`Objective: ${proposal.objective}`);
  }
  lines.push(`Repository: ${repo.repoName} (${repo.repoKey})`);
  lines.push(`Repo path: ${repo.repoPath}`);
  lines.push(`Feature branch: ${repo.featureBranch}`);
  lines.push(`Base branch: ${repo.baseBranch}`);
  if (repo.integrationBranch) {
    lines.push(`Integration branch: ${repo.integrationBranch}`);
  }
  if (repo.productionBranch) {
    lines.push(`Production branch: ${repo.productionBranch}`);
  }
  lines.push('');
  lines.push('Why this repo is involved:');
  lines.push(repo.whyThisRepo);
  lines.push('');
  lines.push('Change surfaces:');
  if (repo.changeSurfaces.length === 0) {
    lines.push('- No declared change surfaces. Infer the smallest safe surface from repo context.');
  } else {
    for (const surface of repo.changeSurfaces) {
      lines.push(`- ${surface.label} (${surface.key}) -> ${surface.paths.join(', ')}`);
      if (surface.notes) {
        lines.push(`  Notes: ${surface.notes}`);
      }
    }
  }
  lines.push('');
  lines.push('Required tasks:');
  for (const task of repo.tasks) {
    lines.push(`- [${task.type}] ${task.title}`);
    lines.push(`  Description: ${task.description}`);
    lines.push(`  Outputs: ${task.outputs.join('; ')}`);
  }
  lines.push('');
  lines.push('Execution steps already defined by the control plane:');
  for (const step of executionSteps) {
    lines.push(`- ${step.id} :: ${step.stage}/${step.kind} :: ${step.title}`);
    if (step.command) {
      lines.push(`  Command: ${step.command}`);
    }
  }
  lines.push('');
  lines.push('Quality gates to satisfy before merge:');
  if (repo.qualityGates.length === 0) {
    lines.push('- No declared quality gates.');
  } else {
    for (const gate of repo.qualityGates) {
      lines.push(`- ${gate.label}: ${gate.command}`);
    }
  }
  lines.push('');
  lines.push('Deployment notes:');
  for (const note of repo.deploymentNotes) {
    lines.push(`- ${note}`);
  }
  lines.push('');
  lines.push('Implementation rules:');
  lines.push('- Keep changes scoped to this repo and feature branch.');
  lines.push('- Prefer the declared change surfaces before broadening scope.');
  lines.push('- Preserve existing delivery pathways; do not invent new branch or deploy flows.');
  lines.push('- Treat quality gates as blocking unless explicitly declared otherwise.');
  lines.push('- If automation is not implemented for a step, emit a concrete manual action list instead of guessing.');

  return lines.join('\n');
}

export function buildTaskBundle(
  proposal: DevWorkspaceChangeProposal,
  manifest: DevWorkspaceExecutionManifest
): DevWorkspaceTaskBundle {
  const repos = proposal.repos.map((repo) => {
    const executionSteps = findRepoExecutionSteps(manifest, repo.repoKey);
    const agentPrompt = buildAgentPrompt(proposal, repo, executionSteps);
    return {
      repoKey: repo.repoKey,
      repoName: repo.repoName,
      repoPath: repo.repoPath,
      branch: repo.featureBranch,
      runtime: repo.runtime,
      language: repo.language,
      objective: proposal.objective,
      summary: `${repo.repoName} task bundle for feature ${proposal.featureName}.`,
      whyThisRepo: repo.whyThisRepo,
      changeSurfaceKeys: repo.changeSurfaces.map((surface) => surface.key),
      taskIds: repo.tasks.map((task) => task.id),
      qualityGateCommands: repo.qualityGates.map((gate) => gate.command),
      executionStepIds: executionSteps.map((step) => step.id),
      deployNotes: repo.deploymentNotes,
      agentPrompt,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    workspaceKey: proposal.workspaceKey,
    workspaceName: proposal.workspaceName,
    featureName: proposal.featureName,
    objective: proposal.objective,
    repos,
  };
}
