import type { ProjectQCConfig } from '../../../packages/project/project-config';

const config: Partial<ProjectQCConfig> = {
  environment: 'production-smoke',
  auth: {
    mode: 'preseeded',
    authStatePath: '.auth/__PROJECT_KEY__-production-smoke.json',
    loginUrl: '',
    successUrlPattern: '/',
    authenticatedCheckUrl: '',
    readonly: true,
    allowProductionWrite: false,
  },
  tests: {
    defaultTags: ['@readonly', '@smoke'],
    smokeTags: ['@readonly', '@smoke'],
    releaseTags: ['@readonly', '@smoke'],
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
    readonly: true,
    allowProductionWrite: false,
    allowExternalWrite: false,
    requireReviewedTestPlan: true,
  },
};

export default config;
