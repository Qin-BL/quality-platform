import {
  getEffectiveBaseBranch,
  getFeatureBranchName,
  getRepoChangeSurfaces,
  getRepoQualityGates,
  type DevWorkspaceChangeSurface,
  type ResolvedDevWorkspaceConfig,
  type ResolvedDevWorkspaceRepoConfig,
} from './workspace-config.ts';

export type DevWorkspaceProposalTaskType =
  | 'scope'
  | 'implementation'
  | 'verification'
  | 'promotion'
  | 'deployment';

export interface DevWorkspaceProposalTask {
  id: string;
  type: DevWorkspaceProposalTaskType;
  title: string;
  description: string;
  outputs: string[];
}

export interface DevWorkspaceRepoProposal {
  repoKey: string;
  repoName: string;
  runtime: ResolvedDevWorkspaceRepoConfig['runtime'];
  language: ResolvedDevWorkspaceRepoConfig['language'];
  repoPath: string;
  baseBranch: string;
  featureBranch: string;
  productionBranch?: string;
  integrationBranch?: string;
  whyThisRepo: string;
  changeSurfaces: DevWorkspaceChangeSurface[];
  qualityGates: ReturnType<typeof getRepoQualityGates>;
  tasks: DevWorkspaceProposalTask[];
  deploymentNotes: string[];
}

export interface DevWorkspaceChangeProposal {
  generatedAt: string;
  workspaceKey: string;
  workspaceName: string;
  featureName: string;
  objective?: string;
  selectedRepos: string[];
  summary: string;
  repos: DevWorkspaceRepoProposal[];
}

function taskId(
  repoKey: string,
  type: DevWorkspaceProposalTaskType,
  index: number
): string {
  return `${repoKey}-${type}-${index}`;
}

function buildWhyThisRepo(
  repo: ResolvedDevWorkspaceRepoConfig,
  objective?: string
): string {
  const objectivePrefix = objective
    ? `Feature objective: ${objective}. `
    : '';

  switch (repo.runtime) {
    case 'frontend':
      return `${objectivePrefix}${repo.displayName} owns user-facing route flows, state transitions, and browser-side API integration for this workspace.`;
    case 'backend':
      return `${objectivePrefix}${repo.displayName} owns application data, orchestration, permissions, and background jobs for this workspace.`;
    case 'llm':
      return `${objectivePrefix}${repo.displayName} owns inference-time prompt/runtime behavior and structured scoring/parsing HTTP contracts.`;
    case 'automation':
      return `${objectivePrefix}${repo.displayName} owns the AI delivery framework, execution control plane, and reusable automation patterns.`;
    default:
      return `${objectivePrefix}${repo.displayName} is part of the workspace delivery surface.`;
  }
}

function buildScopeTask(
  repo: ResolvedDevWorkspaceRepoConfig,
  changeSurfaces: DevWorkspaceChangeSurface[]
): DevWorkspaceProposalTask {
  const scopedSurfaces =
    changeSurfaces.length > 0
      ? changeSurfaces.map((surface) => `\`${surface.label}\``).join(', ')
      : 'the relevant repo surfaces';

  return {
    id: taskId(repo.key, 'scope', 1),
    type: 'scope',
    title: 'Confirm repo scope and impacted surfaces',
    description: `Validate whether this feature changes ${scopedSurfaces}, and narrow the implementation to the smallest set of paths required.`,
    outputs: [
      'Confirmed impacted directories/files',
      'Repo-local acceptance notes',
    ],
  };
}

function buildImplementationTask(
  repo: ResolvedDevWorkspaceRepoConfig,
  changeSurfaces: DevWorkspaceChangeSurface[]
): DevWorkspaceProposalTask {
  const primarySurface =
    changeSurfaces.length > 0 ? changeSurfaces[0].label : 'the primary feature surface';

  return {
    id: taskId(repo.key, 'implementation', 1),
    type: 'implementation',
    title: 'Implement feature changes',
    description: `Apply the repo changes on \`${getFeatureBranchName(repo, 'feature-placeholder').replace('feature-placeholder', '${feature}')}\` with emphasis on ${primarySurface}.`,
    outputs: [
      'Code changes committed on feature branch',
      'Updated repo-local docs or contracts when needed',
    ],
  };
}

function buildVerificationTask(
  repo: ResolvedDevWorkspaceRepoConfig
): DevWorkspaceProposalTask {
  const gates = getRepoQualityGates(repo);
  return {
    id: taskId(repo.key, 'verification', 1),
    type: 'verification',
    title: 'Run repo quality gates',
    description:
      gates.length > 0
        ? `Run the declared repo gates: ${gates.map((gate) => `\`${gate.command}\``).join(', ')}.`
        : 'Run the minimum repo validation commands before merge.',
    outputs: ['Verified local quality gate results'],
  };
}

function buildPromotionTask(
  repo: ResolvedDevWorkspaceRepoConfig
): DevWorkspaceProposalTask {
  const target = repo.integrationBranch || repo.defaultBranch;
  return {
    id: taskId(repo.key, 'promotion', 1),
    type: 'promotion',
    title: 'Promote change through review branch',
    description: `Merge the validated feature branch into \`${target}\` using the repo's normal review workflow.`,
    outputs: ['Merge-ready branch state', 'PR/review artifact'],
  };
}

function buildDeploymentTask(
  repo: ResolvedDevWorkspaceRepoConfig
): DevWorkspaceProposalTask {
  const targets =
    repo.deployTargets.length > 0
      ? repo.deployTargets
          .map((target) => `${target.environment} via \`${target.branch}\``)
          .join(', ')
      : 'repo-specific deploy process';

  return {
    id: taskId(repo.key, 'deployment', 1),
    type: 'deployment',
    title: 'Deploy through mapped environment path',
    description: `Use the repo's existing deployment path: ${targets}.`,
    outputs: ['Environment deployment result', 'Post-deploy validation note'],
  };
}

function buildRepoProposal(
  repo: ResolvedDevWorkspaceRepoConfig,
  featureName: string,
  objective?: string
): DevWorkspaceRepoProposal {
  const changeSurfaces = getRepoChangeSurfaces(repo);
  const baseBranch = getEffectiveBaseBranch(repo);
  const featureBranch = getFeatureBranchName(repo, featureName);

  const implementationTask = buildImplementationTask(repo, changeSurfaces);
  implementationTask.description = implementationTask.description.replace(
    '${feature}',
    featureName
  );

  return {
    repoKey: repo.key,
    repoName: repo.displayName,
    runtime: repo.runtime,
    language: repo.language,
    repoPath: repo.absoluteRepoPath,
    baseBranch,
    featureBranch,
    productionBranch: repo.productionBranch,
    integrationBranch: repo.integrationBranch,
    whyThisRepo: buildWhyThisRepo(repo, objective),
    changeSurfaces,
    qualityGates: getRepoQualityGates(repo),
    tasks: [
      buildScopeTask(repo, changeSurfaces),
      implementationTask,
      buildVerificationTask(repo),
      buildPromotionTask(repo),
      buildDeploymentTask(repo),
    ],
    deploymentNotes:
      repo.deployTargets.length > 0
        ? repo.deployTargets.map((target) => {
            const pipeline = target.pipeline
              ? ` via \`${target.pipeline}\``
              : '';
            const extra = target.notes ? ` (${target.notes})` : '';
            return `${target.environment} -> branch \`${target.branch}\`${pipeline}${extra}`;
          })
        : ['No checked-in deployment target was detected for this repo.'],
  };
}

export function buildChangeProposal(
  workspace: ResolvedDevWorkspaceConfig,
  featureName: string,
  options?: {
    objective?: string;
    repoKeys?: string[];
  }
): DevWorkspaceChangeProposal {
  const selectedRepos = workspace.repos.filter(
    (repo) =>
      !options?.repoKeys ||
      options.repoKeys.length === 0 ||
      options.repoKeys.includes(repo.key)
  );

  const repos = selectedRepos.map((repo) =>
    buildRepoProposal(repo, featureName, options?.objective)
  );

  const summaryParts = [
    `Generate a governed multi-repo delivery proposal for \`${featureName}\`.`,
    options?.objective ? `Objective: ${options.objective}.` : undefined,
    `Selected repos: ${repos.map((repo) => repo.repoKey).join(', ')}.`,
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    workspaceKey: workspace.workspaceKey,
    workspaceName: workspace.displayName,
    featureName,
    objective: options?.objective,
    selectedRepos: repos.map((repo) => repo.repoKey),
    summary: summaryParts.join(' '),
    repos,
  };
}
