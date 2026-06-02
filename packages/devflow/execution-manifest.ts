import { inspectGitRepoState, type GitRepoState } from './repo-state.ts';
import {
  getEffectiveBaseBranch,
  getFeatureBranchName,
  getRepoQualityGates,
  type DevWorkspaceDeployTarget,
  type DevWorkspaceGateStage,
  type DevWorkspaceQualityGate,
  type ResolvedDevWorkspaceConfig,
  type ResolvedDevWorkspaceRepoConfig,
} from './workspace-config.ts';

export type DevWorkspaceExecutionStepKind =
  | 'inspect'
  | 'branch'
  | 'implement'
  | 'verify'
  | 'promote'
  | 'deploy'
  | 'manual';

export type DevWorkspaceExecutionStepStage =
  | 'preflight'
  | 'branching'
  | 'implementation'
  | 'verification'
  | 'promotion'
  | 'deployment';

export interface DevWorkspaceExecutionStep {
  id: string;
  repoKey: string;
  repoName: string;
  stage: DevWorkspaceExecutionStepStage;
  kind: DevWorkspaceExecutionStepKind;
  title: string;
  description: string;
  blocking: boolean;
  branch?: string;
  environment?: string;
  command?: string;
  dependsOn: string[];
  notes: string[];
}

export interface DevWorkspaceRepoExecutionPlan {
  repoKey: string;
  repoName: string;
  runtime: ResolvedDevWorkspaceRepoConfig['runtime'];
  language: ResolvedDevWorkspaceRepoConfig['language'];
  repoPath: string;
  currentBranch?: string;
  baseBranch: string;
  featureBranch: string;
  integrationBranch?: string;
  productionBranch?: string;
  dirty: boolean;
  canAutoPrepareBranch: boolean;
  qualityGates: DevWorkspaceQualityGate[];
  deployTargets: DevWorkspaceDeployTarget[];
  directFeatureDeployTargets: DevWorkspaceDeployTarget[];
  integrationDeployTargets: DevWorkspaceDeployTarget[];
  productionDeployTargets: DevWorkspaceDeployTarget[];
  diagnostics: string[];
}

export interface DevWorkspaceExecutionManifest {
  generatedAt: string;
  workspaceKey: string;
  workspaceName: string;
  featureName: string;
  workspaceRoot: string;
  warnings: string[];
  repos: DevWorkspaceRepoExecutionPlan[];
  steps: DevWorkspaceExecutionStep[];
}

function getStepStageForGate(stage: DevWorkspaceGateStage): DevWorkspaceExecutionStepStage {
  switch (stage) {
    case 'post-branch':
    case 'pre-merge':
      return 'verification';
    case 'pre-deploy':
    case 'post-deploy':
      return 'deployment';
    default:
      return 'verification';
  }
}

function buildDeployBuckets(
  repo: ResolvedDevWorkspaceRepoConfig,
  featureBranch: string
): {
  directFeatureDeployTargets: DevWorkspaceDeployTarget[];
  integrationDeployTargets: DevWorkspaceDeployTarget[];
  productionDeployTargets: DevWorkspaceDeployTarget[];
} {
  const directFeatureDeployTargets = repo.deployTargets.filter(
    (target) => target.branch === '*' || target.branch === featureBranch
  );
  const integrationDeployTargets = repo.deployTargets.filter(
    (target) => target.branch === repo.integrationBranch
  );
  const productionDeployTargets = repo.deployTargets.filter(
    (target) => target.branch === repo.productionBranch
  );

  return {
    directFeatureDeployTargets,
    integrationDeployTargets,
    productionDeployTargets,
  };
}

function repoPlanFromState(
  repo: ResolvedDevWorkspaceRepoConfig,
  featureName: string,
  state: GitRepoState
): DevWorkspaceRepoExecutionPlan {
  const baseBranch = getEffectiveBaseBranch(repo);
  const featureBranch = getFeatureBranchName(repo, featureName);
  const deployBuckets = buildDeployBuckets(repo, featureBranch);

  return {
    repoKey: repo.key,
    repoName: repo.displayName,
    runtime: repo.runtime,
    language: repo.language,
    repoPath: repo.absoluteRepoPath,
    currentBranch: state.currentBranch,
    baseBranch,
    featureBranch,
    integrationBranch: repo.integrationBranch,
    productionBranch: repo.productionBranch,
    dirty: state.dirty,
    canAutoPrepareBranch: state.exists && state.isGitRepo && !state.dirty,
    qualityGates: getRepoQualityGates(repo),
    deployTargets: repo.deployTargets,
    directFeatureDeployTargets: deployBuckets.directFeatureDeployTargets,
    integrationDeployTargets: deployBuckets.integrationDeployTargets,
    productionDeployTargets: deployBuckets.productionDeployTargets,
    diagnostics: state.diagnostics,
  };
}

function createStep(
  repoPlan: DevWorkspaceRepoExecutionPlan,
  partial: Omit<DevWorkspaceExecutionStep, 'repoKey' | 'repoName'>
): DevWorkspaceExecutionStep {
  return {
    ...partial,
    repoKey: repoPlan.repoKey,
    repoName: repoPlan.repoName,
  };
}

export function buildExecutionManifest(
  workspace: ResolvedDevWorkspaceConfig,
  featureName: string
): DevWorkspaceExecutionManifest {
  const warnings: string[] = [];
  const repos = workspace.repos.map((repo) =>
    repoPlanFromState(repo, featureName, inspectGitRepoState(repo.absoluteRepoPath))
  );
  const steps: DevWorkspaceExecutionStep[] = [];

  for (const repoPlan of repos) {
    const inspectStepId = `${repoPlan.repoKey}-inspect`;
    steps.push(
      createStep(repoPlan, {
        id: inspectStepId,
        stage: 'preflight',
        kind: 'inspect',
        title: 'Inspect repository state',
        description:
          'Verify current branch, dirty state, and local diagnostics before any automated repo mutation.',
        blocking: true,
        dependsOn: [],
        notes:
          repoPlan.diagnostics.length > 0
            ? repoPlan.diagnostics
            : repoPlan.dirty
              ? ['Working tree is dirty; auto branch preparation must not mutate this repository.']
              : ['Repository is clean and eligible for automated branch preparation.'],
      })
    );

    const branchStepId = `${repoPlan.repoKey}-branch`;
    steps.push(
      createStep(repoPlan, {
        id: branchStepId,
        stage: 'branching',
        kind: repoPlan.canAutoPrepareBranch ? 'branch' : 'manual',
        title: repoPlan.canAutoPrepareBranch
          ? 'Prepare feature branch'
          : 'Resolve branch preparation blocker',
        description: repoPlan.canAutoPrepareBranch
          ? `Create or switch to \`${repoPlan.featureBranch}\` from \`${repoPlan.baseBranch}\`.`
          : `Manually clean or isolate local changes before preparing \`${repoPlan.featureBranch}\`.`,
        blocking: true,
        branch: repoPlan.featureBranch,
        dependsOn: [inspectStepId],
        notes: [
          `Base branch: ${repoPlan.baseBranch}`,
          `Current branch: ${repoPlan.currentBranch || '(unknown)'}`,
        ],
      })
    );

    const implementStepId = `${repoPlan.repoKey}-implement`;
    steps.push(
      createStep(repoPlan, {
        id: implementStepId,
        stage: 'implementation',
        kind: 'implement',
        title: 'Implement feature work',
        description:
          'Make the feature-scoped code changes in this repository after branch preparation succeeds.',
        blocking: true,
        branch: repoPlan.featureBranch,
        dependsOn: [branchStepId],
        notes: [
          'Implementation is manual/AI-assisted work and should stay inside the feature branch.',
        ],
      })
    );

    const gateIdsByStage = new Map<DevWorkspaceGateStage, string[]>();

    for (const gate of repoPlan.qualityGates) {
      const gateStepId = `${repoPlan.repoKey}-gate-${gate.key}`;
      const dependsOn =
        gate.stage === 'post-branch' ? [branchStepId] : [implementStepId];

      steps.push(
        createStep(repoPlan, {
          id: gateStepId,
          stage: getStepStageForGate(gate.stage),
          kind: 'verify',
          title: gate.label,
          description: `Run quality gate: \`${gate.command}\`.`,
          blocking: gate.required !== false,
          branch: repoPlan.featureBranch,
          command: gate.command,
          dependsOn,
          notes: gate.notes ? [gate.notes] : [],
        })
      );

      gateIdsByStage.set(gate.stage, [
        ...(gateIdsByStage.get(gate.stage) || []),
        gateStepId,
      ]);
    }

    const preMergeGateIds = [
      ...(gateIdsByStage.get('post-branch') || []),
      ...(gateIdsByStage.get('pre-merge') || []),
    ];

    const preDeployGateIds = gateIdsByStage.get('pre-deploy') || [];
    const postDeployGateIds = gateIdsByStage.get('post-deploy') || [];

    const integrationBranch = repoPlan.integrationBranch || repoPlan.baseBranch;
    const needsPromotionToIntegration =
      repoPlan.featureBranch !== integrationBranch &&
      repoPlan.integrationDeployTargets.length > 0;

    let integrationReadyStepIds = preMergeGateIds.length > 0
      ? preMergeGateIds
      : [implementStepId];

    if (needsPromotionToIntegration) {
      const mergeIntegrationStepId = `${repoPlan.repoKey}-promote-integration`;
      steps.push(
        createStep(repoPlan, {
          id: mergeIntegrationStepId,
          stage: 'promotion',
          kind: 'promote',
          title: `Promote to ${integrationBranch}`,
          description: `Merge the feature branch into \`${integrationBranch}\` to unlock downstream environment deployment.`,
          blocking: true,
          branch: integrationBranch,
          dependsOn: integrationReadyStepIds,
          notes: repoPlan.integrationDeployTargets.map(
            (target) =>
              `Required for ${target.environment} deployment${target.pipeline ? ` via ${target.pipeline}` : ''}.`
          ),
        })
      );
      integrationReadyStepIds = [mergeIntegrationStepId];
    }

    for (const target of repoPlan.directFeatureDeployTargets) {
      const deployStepId = `${repoPlan.repoKey}-deploy-${target.environment}-feature`;
      steps.push(
        createStep(repoPlan, {
          id: deployStepId,
          stage: 'deployment',
          kind: 'deploy',
          title: `Deploy feature branch to ${target.environment}`,
          description: target.pipeline
            ? `Deploy \`${repoPlan.featureBranch}\` using \`${target.pipeline}\`.`
            : `Deploy \`${repoPlan.featureBranch}\` to ${target.environment}.`,
          blocking: true,
          branch: repoPlan.featureBranch,
          environment: target.environment,
          dependsOn: [...integrationReadyStepIds, ...preDeployGateIds],
          notes: target.notes ? [target.notes] : [],
        })
      );
    }

    for (const target of repoPlan.integrationDeployTargets) {
      const deployStepId = `${repoPlan.repoKey}-deploy-${target.environment}-integration`;
      steps.push(
        createStep(repoPlan, {
          id: deployStepId,
          stage: 'deployment',
          kind: 'deploy',
          title: `Deploy ${integrationBranch} to ${target.environment}`,
          description: target.pipeline
            ? `Deploy \`${integrationBranch}\` using \`${target.pipeline}\`.`
            : `Deploy \`${integrationBranch}\` to ${target.environment}.`,
          blocking: true,
          branch: integrationBranch,
          environment: target.environment,
          dependsOn: [...integrationReadyStepIds, ...preDeployGateIds],
          notes: target.notes ? [target.notes] : [],
        })
      );
    }

    let productionReadyStepIds = integrationReadyStepIds;
    if (
      repoPlan.productionBranch &&
      repoPlan.productionBranch !== integrationBranch &&
      repoPlan.productionDeployTargets.length > 0
    ) {
      const mergeProductionStepId = `${repoPlan.repoKey}-promote-production`;
      steps.push(
        createStep(repoPlan, {
          id: mergeProductionStepId,
          stage: 'promotion',
          kind: 'promote',
          title: `Promote to ${repoPlan.productionBranch}`,
          description: `Merge \`${integrationBranch}\` into \`${repoPlan.productionBranch}\` for production deployment.`,
          blocking: true,
          branch: repoPlan.productionBranch,
          dependsOn: productionReadyStepIds,
          notes: repoPlan.productionDeployTargets.map(
            (target) =>
              `Required for ${target.environment} deployment${target.pipeline ? ` via ${target.pipeline}` : ''}.`
          ),
        })
      );
      productionReadyStepIds = [mergeProductionStepId];
    }

    for (const target of repoPlan.productionDeployTargets) {
      const deployStepId = `${repoPlan.repoKey}-deploy-${target.environment}-production`;
      steps.push(
        createStep(repoPlan, {
          id: deployStepId,
          stage: 'deployment',
          kind: 'deploy',
          title: `Deploy ${repoPlan.productionBranch || target.branch} to ${target.environment}`,
          description: target.pipeline
            ? `Deploy \`${repoPlan.productionBranch || target.branch}\` using \`${target.pipeline}\`.`
            : `Deploy \`${repoPlan.productionBranch || target.branch}\` to ${target.environment}.`,
          blocking: true,
          branch: repoPlan.productionBranch || target.branch,
          environment: target.environment,
          dependsOn: [...productionReadyStepIds, ...preDeployGateIds],
          notes: target.notes ? [target.notes] : [],
        })
      );
    }

    for (const stepId of postDeployGateIds) {
      const step = steps.find((candidate) => candidate.id === stepId);
      if (step) {
        step.dependsOn = steps
          .filter(
            (candidate) =>
              candidate.repoKey === repoPlan.repoKey &&
              candidate.kind === 'deploy'
          )
          .map((candidate) => candidate.id);
      }
    }

    if (repoPlan.dirty) {
      warnings.push(
        `${repoPlan.repoName} is dirty; automated branch preparation should remain blocked until local changes are cleaned or isolated.`
      );
    }

    if (repoPlan.deployTargets.length === 0) {
      warnings.push(
        `${repoPlan.repoName} has no checked-in deployment targets. Treat environment promotion as manual/documented process only.`
      );
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    workspaceKey: workspace.workspaceKey,
    workspaceName: workspace.displayName,
    featureName,
    workspaceRoot: workspace.workspaceRoot,
    warnings,
    repos,
    steps,
  };
}
