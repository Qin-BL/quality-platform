import type { ProjectQCConfig } from '../../../packages/project/project-config';

const config: ProjectQCConfig = {
  projectKey: '__PROJECT_KEY__',
  displayName: '__PROJECT_DISPLAY_NAME__',
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
    defaultTags: ['@smoke', '@e2e'],
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
    gates: [
      // Example:
      // {
      //   name: '__PROJECT_KEY__-frontend-unit-tests',
      //   workingDir: '../path-to-frontend',
      //   command: 'npm test',
      //   coverage: {
      //     enabled: true,
      //     command: 'npm run test:coverage -- --coverage.reporter=json-summary --coverage.reporter=text',
      //     reportPath: 'coverage/coverage-summary.json',
      //     format: 'istanbul-summary',
      //     moduleGroups: [{ rootDir: 'src/utils', label: 'utils', segmentCount: 1 }],
      //   },
      // },
    ],
  },
  orchestration: {
    enabled: false,
    requiredToProceed: true,
    environmentChecks: [],
    dataDependencies: [],
  },
  mcp: {
    enabled: false,
    baseUrl: '',
    allowedDomains: [],
    readonly: true,
    recordDir: 'reports/audit/mcp',
    defaultSessionName: 'Explore __PROJECT_KEY__',
  },
  appMap: {
    enabled: false,
    modules: [],
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
