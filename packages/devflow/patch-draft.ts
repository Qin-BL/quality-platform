import type { DevWorkspaceImplementationPacketBundle } from './implementation-packet.ts';

export interface DevWorkspacePatchDraftFile {
  filePath: string;
  rationale: string;
  plannedEdits: string[];
}

export interface DevWorkspaceRepoPatchDraft {
  repoKey: string;
  repoName: string;
  repoPath: string;
  branch: string;
  readyForDrafting: boolean;
  manualBlockers: string[];
  acceptanceChecklist: string[];
  files: DevWorkspacePatchDraftFile[];
  draftMarkdown: string;
}

export interface DevWorkspacePatchDraftBundle {
  generatedAt: string;
  workspaceKey: string;
  workspaceName: string;
  featureName: string;
  objective?: string;
  repos: DevWorkspaceRepoPatchDraft[];
}

function defaultPlannedEdits(): string[] {
  return [
    'Confirm whether this file is part of the final minimal change set.',
    'Describe the intended behavioral/code change in one sentence.',
    'List tests or checks affected by this file.',
  ];
}

function uniqueFiles(
  files: DevWorkspacePatchDraftFile[]
): DevWorkspacePatchDraftFile[] {
  const seen = new Set<string>();
  const result: DevWorkspacePatchDraftFile[] = [];

  for (const file of files) {
    if (seen.has(file.filePath)) {
      continue;
    }
    seen.add(file.filePath);
    result.push(file);
  }

  return result;
}

function buildAcceptanceChecklist(
  qualityGateCommands: string[],
  manualBlockers: string[]
): string[] {
  const checklist = [
    'Change scope is limited to the feature objective and declared repo surfaces.',
    'All touched files are justified in the patch plan.',
  ];

  for (const command of qualityGateCommands) {
    checklist.push(`Quality gate passes: ${command}`);
  }

  if (manualBlockers.length > 0) {
    checklist.push('Manual blockers are explicitly resolved or documented before merge.');
  }

  return checklist;
}

function buildDraftMarkdown(
  repoName: string,
  repoPath: string,
  branch: string,
  files: DevWorkspacePatchDraftFile[],
  acceptanceChecklist: string[],
  manualBlockers: string[]
): string {
  const lines: string[] = [];
  lines.push(`# Patch Draft Scaffold — ${repoName}`);
  lines.push('');
  lines.push(`- Repo path: \`${repoPath}\``);
  lines.push(`- Branch: \`${branch}\``);
  lines.push('');
  lines.push('## Planned File Edits');
  lines.push('');
  if (files.length === 0) {
    lines.push('- No candidate files detected. Add files manually before drafting changes.');
  } else {
    for (const file of files) {
      lines.push(`### \`${file.filePath}\``);
      lines.push('');
      lines.push(`- Rationale: ${file.rationale}`);
      for (const plannedEdit of file.plannedEdits) {
        lines.push(`- TODO: ${plannedEdit}`);
      }
      lines.push('');
    }
  }
  lines.push('## Acceptance Checklist');
  lines.push('');
  for (const item of acceptanceChecklist) {
    lines.push(`- [ ] ${item}`);
  }
  lines.push('');
  lines.push('## Manual Blockers');
  lines.push('');
  if (manualBlockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of manualBlockers) {
      lines.push(`- ${blocker}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function buildPatchDraftBundle(
  packet: DevWorkspaceImplementationPacketBundle
): DevWorkspacePatchDraftBundle {
  const repos = packet.repos.map((repo) => {
    const files = uniqueFiles(
      repo.candidateTargets.flatMap((surface) =>
        surface.candidateFiles.slice(0, 5).map((filePath) => ({
          filePath,
          rationale: `Candidate from change surface "${surface.surfaceLabel}".`,
          plannedEdits: defaultPlannedEdits(),
        }))
      )
    );

    const acceptanceChecklist = buildAcceptanceChecklist(
      repo.qualityGateCommands,
      repo.manualBlockers
    );

    return {
      repoKey: repo.repoKey,
      repoName: repo.repoName,
      repoPath: repo.repoPath,
      branch: repo.branch,
      readyForDrafting: repo.readyForDrafting,
      manualBlockers: repo.manualBlockers,
      acceptanceChecklist,
      files,
      draftMarkdown: buildDraftMarkdown(
        repo.repoName,
        repo.repoPath,
        repo.branch,
        files,
        acceptanceChecklist,
        repo.manualBlockers
      ),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    workspaceKey: packet.workspaceKey,
    workspaceName: packet.workspaceName,
    featureName: packet.featureName,
    objective: packet.objective,
    repos,
  };
}
