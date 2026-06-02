import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { discoverProjectConfig } from '../packages/project/project-config-loader';
import {
  createMCPExplorationRun,
  writeMCPExplorationManifest,
} from '../packages/mcp/runtime';

dotenvConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function getArgValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index++) {
    if (args[index] === `--${name}`) {
      return args[index + 1];
    }
  }
  return undefined;
}

async function main(): Promise<void> {
  const projectKey = getArgValue('project') || process.env.PROJECT_KEY;
  const request = getArgValue('request') || 'Readonly MCP exploration requested.';
  const env = process.env.TEST_ENV || 'local';

  console.log('Run MCP Exploration');
  console.log('===================');

  if (!projectKey) {
    console.log('Usage: npm run mcp:explore -- --project <project-key> [--request "<text>"]');
    process.exit(1);
  }

  const discovery = await discoverProjectConfig(projectKey, env, ROOT);
  if (!discovery.config.mcp.enabled) {
    console.log('MCP runtime is not enabled in project config.');
    process.exit(1);
  }

  const run = createMCPExplorationRun(
    projectKey,
    env,
    request,
    discovery.config.mcp,
    ROOT
  );
  const manifestPath = writeMCPExplorationManifest(run);

  console.log(`Session Name: ${run.sessionName}`);
  console.log(`Readonly: ${run.readonly}`);
  console.log(`Base URL: ${run.baseUrl || '(not configured)'}`);
  console.log(`Allowed Domains: ${run.allowedDomains.join(', ') || '(not configured)'}`);
  console.log(`Artifact Dir: ${run.artifactDir}`);
  console.log(`Manifest Path: ${manifestPath}`);
}

await main();
