import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { resolveAuthConfig, formatAuthConfigReport } from '../packages/auth/auth-config';
import { checkAuthState, maskAuthStatePath } from '../packages/auth/auth-state';
import {
  discoverProjectConfig,
  formatProjectConfigDiscovery,
} from '../packages/project/project-config-loader';
import { buildAppMapCoverageSummary } from '../packages/project/app-map';
import {
  getContextLabelFromPath,
  resolveContextPaths,
  resolveGeneratedTestPlanDir,
  resolveReviewedTestPlanDir,
  resolveTestsDir,
} from '../packages/project/project-discovery';

dotenvConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function getProjectKey(): string | undefined {
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--project' || args[index] === '-p') {
      return args[index + 1];
    }
  }

  return process.env.PROJECT_KEY;
}

async function main(): Promise<void> {
  const projectKey = getProjectKey();
  const env = process.env.TEST_ENV || 'local';

  console.log('Project Config Resolution');
  console.log('=========================');

  if (!projectKey) {
    console.log('Usage: npm run project:resolve -- --project <project-key>');
    console.log('   or: PROJECT_KEY=<project-key> npm run project:resolve');
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  console.log(formatProjectConfigDiscovery(discovery));
  console.log('');

  if (!discovery.exists) {
    console.log(`Project root does not exist yet: ${discovery.projectRoot}`);
    console.log(`Create it with: npm run create:project -- --project ${projectKey}`);
    process.exit(1);
  }

  const authConfig = resolveAuthConfig(projectKey, env, discovery.config.auth, ROOT);
  const authStatus = checkAuthState(authConfig, ROOT);
  const contextPaths = resolveContextPaths(projectKey, ROOT);
  const appMapCoverage = buildAppMapCoverageSummary(
    discovery.config.appMap,
    discovery.config.tests.testDir,
    discovery.config.context.testPlansReviewedDir,
    ROOT
  );

  console.log('Resolved Paths:');
  console.log(`  Project Root: ${discovery.projectRoot}`);
  console.log(`  Config Dir: ${discovery.configDir}`);
  console.log(`  Tests Dir: ${resolveTestsDir(projectKey, ROOT)}`);
  console.log(`  Generated Test Plans: ${resolveGeneratedTestPlanDir(projectKey, ROOT)}`);
  console.log(`  Reviewed Test Plans: ${resolveReviewedTestPlanDir(projectKey, ROOT)}`);
  console.log('');

  console.log('Context Files:');
  for (const contextPath of contextPaths) {
    console.log(
      `  ${existsSync(contextPath) ? '✅' : '⚠️'} ${getContextLabelFromPath(contextPath)}`
    );
  }
  console.log('');

  console.log(formatAuthConfigReport(authConfig));
  console.log(`  Auth State Status: ${authStatus.valid ? 'valid' : authStatus.reason}`);
  console.log(`  Auth State Path: ${maskAuthStatePath(authConfig.authStatePath)}`);
  console.log(`  Local Secret Config Path: ${authConfig.localConfigPath}`);
  console.log(`  Local Secret Config Exists: ${authConfig.localConfigExists ? 'Yes' : 'No'}`);
  console.log('');

  console.log('Safety:');
  console.log(`  Readonly: ${discovery.config.safety.readonly}`);
  console.log(`  Allow Production Write: ${discovery.config.safety.allowProductionWrite}`);
  console.log(`  Allow External Write: ${discovery.config.safety.allowExternalWrite}`);
  console.log(`  Require Reviewed Test Plan: ${discovery.config.safety.requireReviewedTestPlan}`);
  console.log('');
  console.log('Unit Test Gate:');
  console.log(`  Enabled: ${discovery.config.unitTests.enabled}`);
  console.log(
    `  Required To Proceed: ${discovery.config.unitTests.requiredToProceed}`
  );
  if (Array.isArray(discovery.config.unitTests.gates) && discovery.config.unitTests.gates.length > 0) {
    for (const gate of discovery.config.unitTests.gates) {
      console.log(`  Gate: ${gate.name}`);
      console.log(`    Working Dir: ${gate.workingDir || '(not configured)'}`);
      console.log(`    Command: ${gate.command || '(not configured)'}`);
      if (gate.coverage?.enabled) {
        console.log('    Coverage:');
        console.log(`      Working Dir: ${gate.coverage.workingDir || gate.workingDir}`);
        console.log(`      Command: ${gate.coverage.command || '(not configured)'}`);
        console.log(`      Report Path: ${gate.coverage.reportPath || '(not configured)'}`);
        console.log(`      Format: ${gate.coverage.format}`);
        console.log(
          `      Required To Proceed: ${gate.coverage.requiredToProceed ? 'Yes' : 'No'}`
        );
        console.log(
          `      Module Groups: ${gate.coverage.moduleGroups.map((group) => group.label ?? group.rootDir).join(', ')}`
        );
      }
    }
  } else {
    console.log(`  Working Dir: ${discovery.config.unitTests.workingDir || '(not configured)'}`);
    console.log(`  Command: ${discovery.config.unitTests.command || '(not configured)'}`);
  }
  console.log('');
  console.log('Environment Orchestration:');
  console.log(`  Enabled: ${discovery.config.orchestration.enabled}`);
  console.log(
    `  Required To Proceed: ${discovery.config.orchestration.requiredToProceed}`
  );
  for (const check of discovery.config.orchestration.environmentChecks) {
    console.log(`  Env Check: ${check.name} (${check.kind}) -> ${check.target}`);
  }
  for (const dependency of discovery.config.orchestration.dataDependencies) {
    console.log(`  Data Dependency: ${dependency.name} (required=${dependency.required})`);
  }
  console.log('');
  console.log('MCP Runtime:');
  console.log(`  Enabled: ${discovery.config.mcp.enabled}`);
  console.log(`  Base URL: ${discovery.config.mcp.baseUrl || '(not configured)'}`);
  console.log(
    `  Allowed Domains: ${discovery.config.mcp.allowedDomains.join(', ') || '(not configured)'}`
  );
  console.log(`  Record Dir: ${discovery.config.mcp.recordDir}`);
  console.log('');
  console.log('App Map:');
  console.log(`  Enabled: ${discovery.config.appMap.enabled}`);
  console.log(
    `  Coverage: ${appMapCoverage.enabled ? `${appMapCoverage.coveredModules}/${appMapCoverage.totalModules}` : '(not configured)'}`
  );
  for (const module of appMapCoverage.modules) {
    console.log(
      `  Module: ${module.displayName} -> ${module.covered ? 'covered' : 'gap'}`
    );
  }
}

await main();
