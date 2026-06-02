import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface RequiredEntry {
  path: string;
  type: 'file' | 'directory';
}

const REQUIRED_ENTRIES: RequiredEntry[] = [
  { path: 'AGENTS.md', type: 'file' },
  { path: 'README.md', type: 'file' },
  { path: 'package.json', type: 'file' },
  { path: 'tsconfig.json', type: 'file' },
  { path: 'playwright.config.ts', type: 'file' },
  { path: '.env.example', type: 'file' },
  { path: '.gitignore', type: 'file' },
  { path: '.github/pull_request_template.md', type: 'file' },
  { path: '.github/workflows/qc-guard.yml', type: 'file' },

  { path: 'agents', type: 'directory' },
  { path: 'agents/planner.agent.md', type: 'file' },
  { path: 'agents/generator.agent.md', type: 'file' },
  { path: 'agents/explorer.agent.md', type: 'file' },
  { path: 'agents/runner.agent.md', type: 'file' },
  { path: 'agents/healer.agent.md', type: 'file' },
  { path: 'agents/external-verifier.agent.md', type: 'file' },
  { path: 'agents/report-writer.agent.md', type: 'file' },
  { path: 'agents/governance.agent.md', type: 'file' },

  { path: 'skills/qc/SKILL.md', type: 'file' },

  { path: 'projects', type: 'directory' },
  { path: 'projects/README.md', type: 'file' },
  { path: 'projects/.gitkeep', type: 'file' },

  { path: 'workspaces', type: 'directory' },
  { path: 'workspaces/README.md', type: 'file' },

  { path: 'requests', type: 'directory' },
  { path: 'requests/README.md', type: 'file' },
  { path: 'requests/incoming/.gitkeep', type: 'file' },
  { path: 'requests/analyzed/.gitkeep', type: 'file' },
  { path: 'requests/completed/.gitkeep', type: 'file' },

  { path: 'test-plans', type: 'directory' },
  { path: 'test-plans/README.md', type: 'file' },
  { path: 'test-plans/generated/.gitkeep', type: 'file' },
  { path: 'test-plans/reviewed/.gitkeep', type: 'file' },
  { path: 'test-plans/archived/.gitkeep', type: 'file' },

  { path: 'test-assets', type: 'directory' },
  { path: 'test-assets/README.md', type: 'file' },
  { path: 'test-assets/generated/.gitkeep', type: 'file' },
  { path: 'test-assets/reviewed/.gitkeep', type: 'file' },
  { path: 'test-assets/promoted/.gitkeep', type: 'file' },
  { path: 'test-assets/deprecated/.gitkeep', type: 'file' },

  { path: 'reports', type: 'directory' },
  { path: 'reports/README.md', type: 'file' },
  { path: 'reports/qc/.gitkeep', type: 'file' },
  { path: 'reports/failures/.gitkeep', type: 'file' },
  { path: 'reports/audit/.gitkeep', type: 'file' },

  { path: 'traces', type: 'directory' },
  { path: 'traces/README.md', type: 'file' },
  { path: 'traces/.gitkeep', type: 'file' },

  { path: 'packages/ai/ai-task-contract.md', type: 'file' },
  { path: 'packages/ai/ai-task-contract.ts', type: 'file' },
  { path: 'packages/ai/ai-task-state-machine.md', type: 'file' },
  { path: 'packages/ai/ai-output-requirements.md', type: 'file' },
  { path: 'packages/ai/simple-usage-guide.md', type: 'file' },
  { path: 'packages/ai/natural-language-qc-request.md', type: 'file' },
  { path: 'packages/ai/impact-analysis-contract.md', type: 'file' },
  { path: 'packages/ai/test-generation-contract.md', type: 'file' },
  { path: 'packages/ai/test-review-checklist.md', type: 'file' },
  { path: 'packages/ai/healing-policy.md', type: 'file' },
  { path: 'packages/ai/governance-policy.md', type: 'file' },
  { path: 'packages/ai/audit-trail-policy.md', type: 'file' },
  { path: 'packages/ai/qc-report-template.md', type: 'file' },

  { path: 'packages/project/README.md', type: 'file' },
  { path: 'packages/project/project-config.ts', type: 'file' },
  { path: 'packages/project/project-config-loader.ts', type: 'file' },
  { path: 'packages/project/project-discovery.ts', type: 'file' },
  { path: 'packages/project/qc-command-parser.ts', type: 'file' },

  { path: 'packages/devflow/README.md', type: 'file' },
  { path: 'packages/devflow/index.ts', type: 'file' },
  { path: 'packages/devflow/workspace-config.ts', type: 'file' },
  { path: 'packages/devflow/workspace-loader.ts', type: 'file' },
  { path: 'packages/devflow/repo-state.ts', type: 'file' },

  { path: 'packages/auth/README.md', type: 'file' },
  { path: 'packages/auth/auth-config.ts', type: 'file' },
  { path: 'packages/auth/auth-state.ts', type: 'file' },
  { path: 'packages/auth/auth-guards.ts', type: 'file' },
  { path: 'packages/auth/auth-bootstrap.ts', type: 'file' },
  { path: 'packages/auth/local-secret-config.ts', type: 'file' },

  { path: 'packages/core/env.ts', type: 'file' },
  { path: 'packages/core/logger.ts', type: 'file' },
  { path: 'packages/core/qc-context.ts', type: 'file' },
  { path: 'packages/core/test-tags.ts', type: 'file' },
  { path: 'packages/core/errors.ts', type: 'file' },
  { path: 'packages/core/guards.ts', type: 'file' },

  { path: 'packages/mcp/README.md', type: 'file' },
  { path: 'packages/mcp/playwright-mcp-guidelines.md', type: 'file' },
  { path: 'packages/mcp/browser-exploration-contract.md', type: 'file' },

  { path: 'packages/healing/failure-classifier.ts', type: 'file' },
  { path: 'packages/healing/healing-suggestion.ts', type: 'file' },
  { path: 'packages/healing/flaky-test-policy.md', type: 'file' },

  { path: 'packages/reporting/qc-report.ts', type: 'file' },
  { path: 'packages/reporting/failure-summary.ts', type: 'file' },
  { path: 'packages/reporting/audit-log.ts', type: 'file' },
  { path: 'packages/reporting/allure-helpers.ts', type: 'file' },

  { path: 'templates/project/AGENTS.template.md', type: 'file' },
  { path: 'templates/workspace/workspace.config.template.ts', type: 'file' },
  { path: 'templates/workspace/context/overview.template.md', type: 'file' },
  { path: 'templates/workspace/context/repositories.template.md', type: 'file' },
  { path: 'templates/workspace/context/environments.template.md', type: 'file' },
  { path: 'templates/project/config/project.config.template.ts', type: 'file' },
  { path: 'templates/project/config/local.template.ts', type: 'file' },
  { path: 'templates/project/config/staging.template.ts', type: 'file' },
  { path: 'templates/project/config/production-smoke.template.ts', type: 'file' },
  { path: 'templates/project/tests/smoke/.gitkeep', type: 'file' },
  { path: 'templates/project/tests/e2e/.gitkeep', type: 'file' },
  { path: 'templates/project/tests/api/.gitkeep', type: 'file' },
  { path: 'templates/project/tests/external/.gitkeep', type: 'file' },
  { path: 'templates/project/tests/visual/.gitkeep', type: 'file' },
  { path: 'templates/project/test-plans/generated/.gitkeep', type: 'file' },
  { path: 'templates/project/test-plans/reviewed/.gitkeep', type: 'file' },
  { path: 'templates/auth/auth.setup.template.ts', type: 'file' },
  { path: 'templates/auth/authenticated-test.template.ts', type: 'file' },
  { path: 'templates/e2e-spec.template.ts', type: 'file' },
  { path: 'templates/api-spec.template.ts', type: 'file' },
  { path: 'templates/external-spec.template.ts', type: 'file' },
  { path: 'templates/visual-spec.template.ts', type: 'file' },
  { path: 'templates/page-object.template.ts', type: 'file' },
  { path: 'templates/api-client.template.ts', type: 'file' },
  { path: 'templates/assertion.template.ts', type: 'file' },
  { path: 'templates/qc-request.template.md', type: 'file' },
  { path: 'templates/impact-analysis.template.md', type: 'file' },
  { path: 'templates/test-plan.template.md', type: 'file' },
  { path: 'templates/reviewed-test-plan.template.md', type: 'file' },
  { path: 'templates/failure-analysis.template.md', type: 'file' },
  { path: 'templates/healing-suggestion.template.md', type: 'file' },
  { path: 'templates/qc-report.template.md', type: 'file' },

  { path: 'docs/qa/architecture.md', type: 'file' },
  { path: 'docs/qa/ai-qc-workflow.md', type: 'file' },
  { path: 'docs/qa/agent-runtime.md', type: 'file' },
  { path: 'docs/qa/simple-qc-command.md', type: 'file' },
  { path: 'docs/qa/project-config-discovery.md', type: 'file' },
  { path: 'docs/qa/auth-bootstrap.md', type: 'file' },
  { path: 'docs/qa/playwright-mcp-strategy.md', type: 'file' },
  { path: 'docs/qa/playwright-test-agents-strategy.md', type: 'file' },
  { path: 'docs/qa/test-generation-strategy.md', type: 'file' },
  { path: 'docs/qa/test-asset-lifecycle.md', type: 'file' },
  { path: 'docs/qa/test-data-strategy.md', type: 'file' },
  { path: 'docs/qa/external-system-checks.md', type: 'file' },
  { path: 'docs/qa/healing-strategy.md', type: 'file' },
  { path: 'docs/qa/ci-strategy.md', type: 'file' },
  { path: 'docs/qa/production-safety.md', type: 'file' },
  { path: 'docs/qa/autonomous-qc-roadmap.md', type: 'file' },
  { path: 'docs/qa/best-practices.md', type: 'file' },

  { path: 'docs/devflow/architecture.md', type: 'file' },

  { path: 'scripts/validate-structure.ts', type: 'file' },
  { path: 'scripts/create-project-space.ts', type: 'file' },
  { path: 'scripts/create-dev-workspace.ts', type: 'file' },
  { path: 'scripts/resolve-project-config.ts', type: 'file' },
  { path: 'scripts/resolve-dev-workspace.ts', type: 'file' },
  { path: 'scripts/plan-ai-dev.ts', type: 'file' },
  { path: 'scripts/prepare-dev-branches.ts', type: 'file' },
  { path: 'scripts/sync-framework-mirror.ts', type: 'file' },
  { path: 'scripts/run-qc.ts', type: 'file' },
  { path: 'scripts/auth-login.ts', type: 'file' },
  { path: 'scripts/check-auth-state.ts', type: 'file' },
  { path: 'scripts/analyze-impact.ts', type: 'file' },
  { path: 'scripts/generate-test-plan.ts', type: 'file' },
  { path: 'scripts/promote-test-asset.ts', type: 'file' },
  { path: 'scripts/classify-failure.ts', type: 'file' },
  { path: 'scripts/qc-summary.ts', type: 'file' },
  { path: 'scripts/guard-production.ts', type: 'file' },
  { path: 'scripts/check-ai-readiness.ts', type: 'file' },
  { path: 'scripts/check-test-plan-required.ts', type: 'file' },
  { path: 'scripts/check-no-business-test-without-reviewed-plan.ts', type: 'file' },
  { path: 'scripts/check-no-production-write.ts', type: 'file' },
  { path: 'scripts/check-no-hardcoded-secret.ts', type: 'file' },
  { path: 'scripts/check-generated-not-promoted.ts', type: 'file' },
  { path: 'scripts/check-spec-layering.ts', type: 'file' },
];

function main(): void {
  console.log('Validating quality-platform structure...');
  console.log('');

  const missing: string[] = [];

  for (const entry of REQUIRED_ENTRIES) {
    const fullPath = resolve(ROOT, entry.path);
    if (!existsSync(fullPath)) {
      missing.push(`${entry.type === 'file' ? 'MISSING FILE' : 'MISSING DIR'}: ${entry.path}`);
    }
  }

  if (missing.length > 0) {
    console.log('Missing entries:');
    for (const item of missing) {
      console.log(`  ${item}`);
    }
    process.exit(1);
  }

  console.log(`Result: ${REQUIRED_ENTRIES.length}/${REQUIRED_ENTRIES.length} entries verified.`);
  console.log('Structure validation PASSED.');
}

main();
