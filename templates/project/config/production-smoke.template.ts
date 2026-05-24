import type { ProjectQCConfig } from '../../../packages/project/project-config';

const config: ProjectQCConfig = {
  projectKey: '__PROJECT_KEY__',
  displayName: '__PROJECT_DISPLAY_NAME__',
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
  context: {
    contextDir: 'projects/__PROJECT_KEY__/context',
    testPlansGeneratedDir: 'projects/__PROJECT_KEY__/test-plans/generated',
    testPlansReviewedDir: 'projects/__PROJECT_KEY__/test-plans/reviewed',
    testPlansArchivedDir: 'projects/__PROJECT_KEY__/test-plans/archived',
  },
  unitTests: {
    enabled: false,
    workingDir: '',
    command: '',
    requiredToProceed: true,
  },
  externalSystems: [],
  safety: {
    readonly: true,
    allowProductionWrite: false,
    allowExternalWrite: false,
    requireReviewedTestPlan: true,
  },
};

export default config;
