import type { ProjectQCConfig } from '../../../packages/project/project-config';

const config: ProjectQCConfig = {
  projectKey: '__PROJECT_KEY__',
  displayName: '__PROJECT_DISPLAY_NAME__',
  environment: 'staging',
  auth: {
    mode: 'env',
    authStatePath: '.auth/__PROJECT_KEY__-staging.json',
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
    readonly: false,
    allowProductionWrite: false,
    allowExternalWrite: false,
    requireReviewedTestPlan: true,
  },
};

export default config;
