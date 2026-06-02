import type { ProjectQCConfig } from '../../../packages/project/project-config';

const config: Partial<ProjectQCConfig> = {
  environment: 'local',
  auth: {
    mode: 'manual',
    authStatePath: '.auth/__PROJECT_KEY__-local.json',
    loginUrl: '',
    successUrlPattern: '/',
    authenticatedCheckUrl: '',
    readonly: false,
    allowProductionWrite: false,
  },
  tests: {
    defaultTags: ['@smoke', '@e2e', '@api'],
    smokeTags: ['@smoke'],
    releaseTags: ['@smoke', '@e2e', '@api'],
    productionSmokeTags: ['@readonly', '@smoke'],
    testDir: 'projects/__PROJECT_KEY__/tests',
    reportDir: 'reports/qc',
  },
  unitTests: {
    enabled: false,
    workingDir: '',
    command: '',
    requiredToProceed: true,
    gates: [],
  },
  safety: {
    readonly: false,
    allowProductionWrite: false,
    allowExternalWrite: false,
    requireReviewedTestPlan: true,
  },
};

export default config;
