import type { DevWorkspacePatchDraftBundle } from './patch-draft.ts';
import type {
  DevWorkspaceExecutionManifest,
  DevWorkspaceExecutionStep,
} from './execution-manifest.ts';
import type {
  DevWorkspaceImplementationPacketBundle,
  DevWorkspaceRepoImplementationPacket,
} from './implementation-packet.ts';
import type { DevWorkspaceWorkOrderPacket } from './work-order.ts';

export interface DevWorkspaceRepoAgentSession {
  repoKey: string;
  repoName: string;
  repoPath: string;
  branch: string;
  readyForSessionLaunch: boolean;
  manualBlockers: string[];
  summary: string;
  artifacts: {
    workOrderJsonPath: string;
    workOrderPromptPath: string;
    patchDraftJsonPath: string;
    patchDraftMarkdownPath: string;
  };
  verificationCommands: string[];
  executableStepIds: string[];
  sessionPrompt: string;
  sessionMarkdown: string;
}

export interface DevWorkspaceAgentSessionBundle {
  generatedAt: string;
  workspaceKey: string;
  workspaceName: string;
  featureName: string;
  objective?: string;
  sessions: DevWorkspaceRepoAgentSession[];
}

function findImplementationRepo(
  bundle: DevWorkspaceImplementationPacketBundle,
  repoKey: string
): DevWorkspaceRepoImplementationPacket {
  const repo = bundle.repos.find((item) => item.repoKey === repoKey);
  if (!repo) {
    throw new Error(`Missing implementation packet for repo: ${repoKey}`);
  }
  return repo;
}

function findPatchDraftRepo(
  bundle: DevWorkspacePatchDraftBundle,
  repoKey: string
) {
  const repo = bundle.repos.find((item) => item.repoKey === repoKey);
  if (!repo) {
    throw new Error(`Missing patch draft for repo: ${repoKey}`);
  }
  return repo;
}

function findExecutionSteps(
  manifest: DevWorkspaceExecutionManifest,
  repoKey: string
): DevWorkspaceExecutionStep[] {
  return manifest.steps.filter((step) => step.repoKey === repoKey);
}

function buildSummary(
  repoName: string,
  branch: string,
  verificationCommands: string[]
): string {
  const verificationSummary =
    verificationCommands.length > 0
      ? verificationCommands.join(' ; ')
      : 'No declared verification commands';

  return `${repoName} agent session on branch ${branch}. Verification gates: ${verificationSummary}.`;
}

function buildSessionPrompt(params: {
  workspaceName: string;
  featureName: string;
  objective?: string;
  repoName: string;
  repoPath: string;
  branch: string;
  summary: string;
  manualBlockers: string[];
  patchDraftMarkdownPath: string;
  workOrderPromptPath: string;
  verificationCommands: string[];
  executableSteps: DevWorkspaceExecutionStep[];
}): string {
  const lines: string[] = [];

  lines.push(`Workspace: ${params.workspaceName}`);
  lines.push(`Feature: ${params.featureName}`);
  if (params.objective) {
    lines.push(`Objective: ${params.objective}`);
  }
  lines.push(`Repository: ${params.repoName}`);
  lines.push(`Repo path: ${params.repoPath}`);
  lines.push(`Feature branch: ${params.branch}`);
  lines.push(`Session summary: ${params.summary}`);
  lines.push('');
  lines.push('Primary inputs:');
  lines.push(`- Work-order prompt: ${params.workOrderPromptPath}`);
  lines.push(`- Patch draft scaffold: ${params.patchDraftMarkdownPath}`);
  lines.push('');
  lines.push('Execution expectations:');
  lines.push('- Read the work-order prompt first.');
  lines.push('- Use the patch draft scaffold to constrain touched files and acceptance criteria.');
  lines.push('- Produce a repo-local implementation patch proposal before writing code.');
  lines.push('- Keep change scope aligned with the declared feature objective.');
  lines.push('');
  lines.push('Executable control-plane steps already available:');
  if (params.executableSteps.length === 0) {
    lines.push('- None.');
  } else {
    for (const step of params.executableSteps) {
      const commandText = step.command ? ` :: ${step.command}` : '';
      lines.push(`- ${step.id} :: ${step.stage}/${step.kind}${commandText}`);
    }
  }
  lines.push('');
  lines.push('Verification commands to satisfy before handoff:');
  if (params.verificationCommands.length === 0) {
    lines.push('- None declared.');
  } else {
    for (const command of params.verificationCommands) {
      lines.push(`- ${command}`);
    }
  }
  lines.push('');
  lines.push('Manual blockers:');
  if (params.manualBlockers.length === 0) {
    lines.push('- None.');
  } else {
    for (const blocker of params.manualBlockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');
  lines.push('Expected outputs:');
  lines.push('- Repo-local code changes or explicit no-change decision.');
  lines.push('- Updated patch draft or implementation notes.');
  lines.push('- Verification results.');

  return `${lines.join('\n')}\n`;
}

function buildSessionMarkdown(
  session: Omit<DevWorkspaceRepoAgentSession, 'sessionMarkdown'>
): string {
  const lines: string[] = [];

  lines.push(`# Agent Session — ${session.repoName}`);
  lines.push('');
  lines.push(`- Repo path: \`${session.repoPath}\``);
  lines.push(`- Branch: \`${session.branch}\``);
  lines.push(`- Ready for session launch: ${session.readyForSessionLaunch ? 'yes' : 'manual review'}`);
  lines.push(`- Summary: ${session.summary}`);
  lines.push('');
  lines.push('## Artifacts');
  lines.push('');
  lines.push(`- Work-order prompt: \`${session.artifacts.workOrderPromptPath}\``);
  lines.push(`- Work-order JSON: \`${session.artifacts.workOrderJsonPath}\``);
  lines.push(`- Patch draft JSON: \`${session.artifacts.patchDraftJsonPath}\``);
  lines.push(`- Patch draft Markdown: \`${session.artifacts.patchDraftMarkdownPath}\``);
  lines.push('');
  lines.push('## Verification Commands');
  lines.push('');
  if (session.verificationCommands.length === 0) {
    lines.push('- None declared');
  } else {
    for (const command of session.verificationCommands) {
      lines.push(`- \`${command}\``);
    }
  }
  lines.push('');
  lines.push('## Executable Step IDs');
  lines.push('');
  if (session.executableStepIds.length === 0) {
    lines.push('- None');
  } else {
    for (const stepId of session.executableStepIds) {
      lines.push(`- \`${stepId}\``);
    }
  }
  lines.push('');
  lines.push('## Manual Blockers');
  lines.push('');
  if (session.manualBlockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of session.manualBlockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');
  lines.push('## Session Prompt');
  lines.push('');
  lines.push('```text');
  lines.push(session.sessionPrompt.trimEnd());
  lines.push('```');

  return `${lines.join('\n')}\n`;
}

export function buildAgentSessionBundle(
  workOrders: DevWorkspaceWorkOrderPacket,
  implementationPackets: DevWorkspaceImplementationPacketBundle,
  patchDrafts: DevWorkspacePatchDraftBundle,
  manifest: DevWorkspaceExecutionManifest
): DevWorkspaceAgentSessionBundle {
  const sessions = workOrders.repos.map((repo) => {
    const implementationRepo = findImplementationRepo(implementationPackets, repo.repoKey);
    const patchDraftRepo = findPatchDraftRepo(patchDrafts, repo.repoKey);
    const executableSteps = findExecutionSteps(manifest, repo.repoKey).filter(
      (step) => step.kind === 'inspect' || step.kind === 'branch' || step.kind === 'verify'
    );

    const summary = buildSummary(
      repo.repoName,
      repo.branch,
      implementationRepo.qualityGateCommands
    );

    const workOrderJsonPath = repo.jsonPath;
    const workOrderPromptPath = repo.promptPath;
    const patchDraftBase = workOrders.outputDirectoryName.replace(
      /\.work-orders$/,
      '.patch-drafts'
    );
    const artifacts = {
      workOrderJsonPath,
      workOrderPromptPath,
      patchDraftJsonPath: `${patchDraftBase}/${repo.repoKey}.json`,
      patchDraftMarkdownPath: `${patchDraftBase}/${repo.repoKey}.draft.md`,
    };

    const sessionPrompt = buildSessionPrompt({
      workspaceName: workOrders.workspaceName,
      featureName: workOrders.featureName,
      objective: workOrders.objective,
      repoName: repo.repoName,
      repoPath: repo.repoPath,
      branch: repo.branch,
      summary,
      manualBlockers: repo.manualBlockers,
      patchDraftMarkdownPath: artifacts.patchDraftMarkdownPath,
      workOrderPromptPath: artifacts.workOrderPromptPath,
      verificationCommands: implementationRepo.qualityGateCommands,
      executableSteps,
    });

    const sessionBase: Omit<DevWorkspaceRepoAgentSession, 'sessionMarkdown'> = {
      repoKey: repo.repoKey,
      repoName: repo.repoName,
      repoPath: repo.repoPath,
      branch: repo.branch,
      readyForSessionLaunch:
        repo.readyForAgentExecution &&
        implementationRepo.readyForDrafting &&
        patchDraftRepo.readyForDrafting,
      manualBlockers: uniqueManualBlockers([
        ...repo.manualBlockers,
        ...implementationRepo.manualBlockers,
        ...patchDraftRepo.manualBlockers,
      ]),
      summary,
      artifacts,
      verificationCommands: implementationRepo.qualityGateCommands,
      executableStepIds: executableSteps.map((step) => step.id),
      sessionPrompt,
    };

    return {
      ...sessionBase,
      sessionMarkdown: buildSessionMarkdown(sessionBase),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    workspaceKey: workOrders.workspaceKey,
    workspaceName: workOrders.workspaceName,
    featureName: workOrders.featureName,
    objective: workOrders.objective,
    sessions,
  };
}

function uniqueManualBlockers(blockers: string[]): string[] {
  return Array.from(new Set(blockers));
}
