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

export const UNIT_TEST_COVERAGE_FORMATS = [
  'istanbul-summary',
  'coverage.py-json',
] as const;

export type ProjectUnitTestCoverageFormat =
  (typeof UNIT_TEST_COVERAGE_FORMATS)[number];

export interface ProjectUnitTestCoverageThresholds {
  lines?: number;
  statements?: number;
  functions?: number;
  branches?: number;
}

export interface ProjectUnitTestCoverageModuleGroupConfig {
  rootDir: string;
  segmentCount?: number;
  label?: string;
  includeRootFilesAs?: string;
}

export interface ProjectUnitTestCoverageConfig {
  enabled: boolean;
  command: string;
  reportPath: string;
  format: ProjectUnitTestCoverageFormat;
  workingDir?: string;
  requiredToProceed?: boolean;
  thresholds?: ProjectUnitTestCoverageThresholds;
  minimumModuleLineCoverage?: number;
  moduleGroups: ProjectUnitTestCoverageModuleGroupConfig[];
}

export interface ProjectUnitTestGateConfig {
  name: string;
  workingDir: string;
  command: string;
  coverage?: ProjectUnitTestCoverageConfig;
}

export interface ProjectSafetyConfig {
  readonly: boolean;
  allowProductionWrite: boolean;
  allowExternalWrite: boolean;
  requireReviewedTestPlan: boolean;
}

export type ProjectEnvironmentCheckKind = 'command' | 'file_exists' | 'http_get';

export interface ProjectEnvironmentCheckConfig {
  name: string;
  kind: ProjectEnvironmentCheckKind;
  target: string;
  successPattern?: string;
  timeoutMs?: number;
  notes?: string;
}

export interface ProjectDataDependencyConfig {
  name: string;
  required: boolean;
  checkCommand?: string;
  provisionCommand?: string;
  notes?: string;
}

export interface ProjectOrchestrationConfig {
  enabled: boolean;
  requiredToProceed: boolean;
  environmentChecks: ProjectEnvironmentCheckConfig[];
  dataDependencies: ProjectDataDependencyConfig[];
}

export interface ProjectMCPConfig {
  enabled: boolean;
  baseUrl: string;
  allowedDomains: string[];
  readonly: boolean;
  recordDir: string;
  defaultSessionName: string;
}

export type ProjectAppMapModuleKind =
  | 'auth'
  | 'ui'
  | 'api'
  | 'workflow'
  | 'external'
  | 'data';

export interface ProjectAppMapModuleConfig {
  key: string;
  displayName: string;
  kind: ProjectAppMapModuleKind;
  aliases: string[];
  routes: string[];
  apiPatterns: string[];
  critical: boolean;
}

export interface ProjectAppMapConfig {
  enabled: boolean;
  modules: ProjectAppMapModuleConfig[];
}

export interface ProjectQCConfig {
  projectKey: string;
  displayName: string;
  environment: ProjectEnvironment;
  auth: ProjectAuthConfig;
  tests: ProjectTestConfig;
  context: ProjectContextConfig;
  unitTests: ProjectUnitTestConfig;
  orchestration: ProjectOrchestrationConfig;
  mcp: ProjectMCPConfig;
  appMap: ProjectAppMapConfig;
  externalSystems: string[];
  safety: ProjectSafetyConfig;
}

function mergeCoverageConfig(
  base?: ProjectUnitTestCoverageConfig,
  override?: ProjectUnitTestCoverageConfig
): ProjectUnitTestCoverageConfig | undefined {
  if (!base) {
    return override;
  }

  if (!override) {
    return base;
  }

  return {
    ...base,
    ...override,
    moduleGroups: override.moduleGroups.length > 0 ? override.moduleGroups : base.moduleGroups,
  };
}

function mergeUnitTestGates(
  baseGates?: ProjectUnitTestGateConfig[],
  overrideGates?: ProjectUnitTestGateConfig[]
): ProjectUnitTestGateConfig[] | undefined {
  if (!overrideGates) {
    return baseGates;
  }

  if (!baseGates || baseGates.length === 0) {
    return overrideGates;
  }

  const merged = new Map<string, ProjectUnitTestGateConfig>();
  for (const gate of baseGates) {
    merged.set(gate.name, gate);
  }

  for (const gate of overrideGates) {
    const existing = merged.get(gate.name);
    if (!existing) {
      merged.set(gate.name, gate);
      continue;
    }

    merged.set(gate.name, {
      ...existing,
      ...gate,
      coverage: mergeCoverageConfig(existing.coverage, gate.coverage),
    });
  }

  return [...merged.values()];
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
  orchestrationEnabled: false,
  orchestrationRequiredToProceed: true,
  mcpEnabled: false,
  mcpReadonly: true,
  mcpRecordDir: 'reports/audit/mcp',
  appMapEnabled: false,
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
    orchestration: {
      enabled: SAFE_DEFAULTS.orchestrationEnabled,
      requiredToProceed: SAFE_DEFAULTS.orchestrationRequiredToProceed,
      environmentChecks: [],
      dataDependencies: [],
    },
    mcp: {
      enabled: SAFE_DEFAULTS.mcpEnabled,
      baseUrl: '',
      allowedDomains: [],
      readonly: SAFE_DEFAULTS.mcpReadonly,
      recordDir: SAFE_DEFAULTS.mcpRecordDir,
      defaultSessionName: `Explore ${projectKey}`,
    },
    appMap: {
      enabled: SAFE_DEFAULTS.appMapEnabled,
      modules: [],
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
      gates: mergeUnitTestGates(base.unitTests.gates, override.unitTests?.gates),
    },
    orchestration: {
      ...base.orchestration,
      ...override.orchestration,
      environmentChecks:
        override.orchestration?.environmentChecks ?? base.orchestration.environmentChecks,
      dataDependencies:
        override.orchestration?.dataDependencies ?? base.orchestration.dataDependencies,
    },
    mcp: {
      ...base.mcp,
      ...override.mcp,
      allowedDomains: override.mcp?.allowedDomains ?? base.mcp.allowedDomains,
    },
    appMap: {
      ...base.appMap,
      ...override.appMap,
      modules: override.appMap?.modules ?? base.appMap.modules,
    },
    externalSystems: override.externalSystems ?? base.externalSystems,
    safety: {
      ...base.safety,
      ...override.safety,
    },
  };
}
