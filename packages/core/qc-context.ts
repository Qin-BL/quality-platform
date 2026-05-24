export type TestEnvironment = 'local' | 'staging' | 'production-smoke';

export type TestLevel = 'smoke' | 'e2e' | 'api' | 'external' | 'visual';

export interface ExternalSystemInfo {
  name: string;
  baseUrl: string;
  connected: boolean;
}

export interface QCContext {
  projectKey: string;
  environment: TestEnvironment;
  requestId?: string;
  testLevels: TestLevel[];
  externalSystems: ExternalSystemInfo[];
  artifactsPath: string;
  contextFiles: string[];
  reviewedTestPlanPaths: string[];
  startedAt: Date;
}

export interface ProjectConfig {
  projectKey: string;
  environment: TestEnvironment;
  appBaseUrl: string;
  apiBaseUrl: string;
  testUserEmail: string;
  testUserPassword: string;
  allowProductionReadonly: boolean;
  allowProductionWrite: boolean;
}

export function createQCContext(
  config: ProjectConfig,
  testLevels: TestLevel[]
): QCContext {
  return {
    projectKey: config.projectKey,
    environment: config.environment,
    requestId: undefined,
    testLevels,
    externalSystems: [],
    artifactsPath: './test-results',
    contextFiles: [],
    reviewedTestPlanPaths: [],
    startedAt: new Date(),
  };
}
