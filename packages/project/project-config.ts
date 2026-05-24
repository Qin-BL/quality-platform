export const PROJECT_ENVIRONMENTS = [
  'local',
  'staging',
  'production-smoke',
] as const;

export type ProjectEnvironment = (typeof PROJECT_ENVIRONMENTS)[number];

export type ProjectAuthMode = 'manual' | 'env' | 'preseeded';

export interface ProjectAuthConfig {
  mode: ProjectAuthMode;
  authStatePath: string;
  loginUrl: string;
  successUrlPattern: string;
  authenticatedCheckUrl: string;
  readonly: boolean;
  allowProductionWrite: boolean;
}

export interface ProjectTestConfig {
  defaultTags: string[];
  smokeTags: string[];
  releaseTags: string[];
  productionSmokeTags: string[];
  testDir: string;
  reportDir: string;
}

export interface ProjectContextConfig {
  contextDir: string;
  testPlansGeneratedDir: string;
  testPlansReviewedDir: string;
  testPlansArchivedDir: string;
}

export interface ProjectUnitTestConfig {
  enabled: boolean;
  workingDir: string;
  command: string;
  requiredToProceed: boolean;
  gates?: ProjectUnitTestGateConfig[];
}

export interface ProjectUnitTestGateConfig {
  name: string;
  workingDir: string;
  command: string;
}

export interface ProjectSafetyConfig {
  readonly: boolean;
  allowProductionWrite: boolean;
  allowExternalWrite: boolean;
  requireReviewedTestPlan: boolean;
}

export interface ProjectQCConfig {
  projectKey: string;
  displayName: string;
  environment: ProjectEnvironment;
  auth: ProjectAuthConfig;
  tests: ProjectTestConfig;
  context: ProjectContextConfig;
  unitTests: ProjectUnitTestConfig;
  externalSystems: string[];
  safety: ProjectSafetyConfig;
}

export function isProjectEnvironment(value: string): value is ProjectEnvironment {
  return (PROJECT_ENVIRONMENTS as readonly string[]).includes(value);
}

export function normalizeProjectEnvironment(value?: string): ProjectEnvironment {
  if (!value) return 'local';
  if (value === 'production') return 'production-smoke';
  return isProjectEnvironment(value) ? value : 'local';
}

export function getProjectRoot(projectKey: string): string {
  return `projects/${projectKey}`;
}

export function getAuthStatePath(projectKey: string, env: string): string {
  return `.auth/${projectKey}-${env}.json`;
}

export function getDefaultConfigDir(projectKey: string): string {
  return `projects/${projectKey}/config`;
}

export function getDefaultContextDir(projectKey: string): string {
  return `projects/${projectKey}/context`;
}

export function getDefaultTestsDir(projectKey: string): string {
  return `projects/${projectKey}/tests`;
}

export function getDefaultTestPlansDir(
  projectKey: string,
  stage: 'generated' | 'reviewed' | 'archived'
): string {
  return `projects/${projectKey}/test-plans/${stage}`;
}

export const DEFAULT_AUTH_CONFIG: Partial<ProjectAuthConfig> = {
  mode: 'manual',
  readonly: false,
  allowProductionWrite: false,
  successUrlPattern: '/',
};

export const SAFE_DEFAULTS = {
  allowProductionWrite: false,
  allowExternalWrite: false,
  readonly: true,
  requireReviewedTestPlan: true,
  testDir: 'tests',
  reportDir: 'reports/qc',
  unitTestsEnabled: false,
  unitTestsRequiredToProceed: true,
};

function getDefaultAuthMode(environment: ProjectEnvironment): ProjectAuthMode {
  if (environment === 'local') return 'manual';
  if (environment === 'staging') return 'env';
  return 'preseeded';
}

export function createDefaultProjectConfig(
  projectKey: string,
  environment: ProjectEnvironment
): ProjectQCConfig {
  const readonly = environment === 'production-smoke';

  return {
    projectKey,
    displayName: projectKey,
    environment,
    auth: {
      mode: getDefaultAuthMode(environment),
      authStatePath: getAuthStatePath(projectKey, environment),
      loginUrl: '',
      successUrlPattern: '/',
      authenticatedCheckUrl: '',
      readonly,
      allowProductionWrite: false,
    },
    tests: {
      defaultTags: ['@smoke'],
      smokeTags: ['@smoke'],
      releaseTags: ['@smoke', '@e2e', '@api'],
      productionSmokeTags: ['@readonly', '@smoke'],
      testDir: getDefaultTestsDir(projectKey),
      reportDir: SAFE_DEFAULTS.reportDir,
    },
    context: {
      contextDir: getDefaultContextDir(projectKey),
      testPlansGeneratedDir: getDefaultTestPlansDir(projectKey, 'generated'),
      testPlansReviewedDir: getDefaultTestPlansDir(projectKey, 'reviewed'),
      testPlansArchivedDir: getDefaultTestPlansDir(projectKey, 'archived'),
    },
    unitTests: {
      enabled: SAFE_DEFAULTS.unitTestsEnabled,
      workingDir: '',
      command: '',
      requiredToProceed: SAFE_DEFAULTS.unitTestsRequiredToProceed,
    },
    externalSystems: [],
    safety: {
      readonly,
      allowProductionWrite: false,
      allowExternalWrite: false,
      requireReviewedTestPlan: true,
    },
  };
}

export function mergeProjectConfig(
  base: ProjectQCConfig,
  override?: Partial<ProjectQCConfig>
): ProjectQCConfig {
  if (!override) return base;

  return {
    ...base,
    ...override,
    auth: {
      ...base.auth,
      ...override.auth,
    },
    tests: {
      ...base.tests,
      ...override.tests,
    },
    context: {
      ...base.context,
      ...override.context,
    },
    unitTests: {
      ...base.unitTests,
      ...override.unitTests,
    },
    externalSystems: override.externalSystems ?? base.externalSystems,
    safety: {
      ...base.safety,
      ...override.safety,
    },
  };
}
