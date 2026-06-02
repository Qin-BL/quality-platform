export type DevWorkspaceEnvironment = 'local' | 'test' | 'production';

export type DevWorkspaceRuntime =
  | 'frontend'
  | 'backend'
  | 'llm'
  | 'automation';

export type DevWorkspaceLanguage =
  | 'typescript'
  | 'python'
  | 'go'
  | 'mixed';

export interface DevWorkspaceCommandSet {
  install?: string;
  build?: string;
  test?: string;
  lint?: string;
  start?: string;
}

export interface DevWorkspaceChangeSurface {
  key: string;
  label: string;
  paths: string[];
  notes?: string;
}

export type DevWorkspaceGateStage =
  | 'post-branch'
  | 'pre-merge'
  | 'pre-deploy'
  | 'post-deploy';

export interface DevWorkspaceQualityGate {
  key: string;
  label: string;
  command: string;
  stage: DevWorkspaceGateStage;
  required?: boolean;
  notes?: string;
}

export interface DevWorkspaceDeployTarget {
  environment: DevWorkspaceEnvironment;
  branch: string;
  pipeline?: string;
  notes?: string;
}

export interface DevWorkspaceRepoConfig {
  key: string;
  displayName: string;
  repoPath: string;
  runtime: DevWorkspaceRuntime;
  language: DevWorkspaceLanguage;
  defaultBranch: string;
  integrationBranch?: string;
  productionBranch?: string;
  featureBranchPrefix: string;
  commands: DevWorkspaceCommandSet;
  qualityGates?: DevWorkspaceQualityGate[];
  changeSurfaces?: DevWorkspaceChangeSurface[];
  deployTargets: DevWorkspaceDeployTarget[];
  notes?: string;
}

export interface DevWorkspaceMirrorConfig {
  mirrorPath: string;
  includePaths: string[];
}

export interface DevWorkspaceConfig {
  workspaceKey: string;
  displayName: string;
  description: string;
  sharedPlanPath?: string;
  frameworkRepoKey: string;
  frameworkMirror?: DevWorkspaceMirrorConfig;
  repos: DevWorkspaceRepoConfig[];
}

export interface ResolvedDevWorkspaceRepoConfig extends DevWorkspaceRepoConfig {
  absoluteRepoPath: string;
}

export interface ResolvedDevWorkspaceConfig extends DevWorkspaceConfig {
  workspaceRoot: string;
  absoluteSharedPlanPath?: string;
  absoluteFrameworkMirrorPath?: string;
  repos: ResolvedDevWorkspaceRepoConfig[];
}

export function slugifyFeatureName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function getEffectiveBaseBranch(repo: DevWorkspaceRepoConfig): string {
  return repo.integrationBranch || repo.defaultBranch;
}

export function getFeatureBranchName(
  repo: DevWorkspaceRepoConfig,
  featureName: string
): string {
  return `${repo.featureBranchPrefix}${slugifyFeatureName(featureName)}`;
}

export function getRepoQualityGates(
  repo: DevWorkspaceRepoConfig
): DevWorkspaceQualityGate[] {
  return repo.qualityGates || [];
}

export function getRepoChangeSurfaces(
  repo: DevWorkspaceRepoConfig
): DevWorkspaceChangeSurface[] {
  return repo.changeSurfaces || [];
}
