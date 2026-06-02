import { normalizeProjectEnvironment, type ProjectEnvironment } from '../project/project-config';

export const AI_TASK_REQUIRED_READ_ORDER = [
  'AGENTS.md',
  'skills/quality-platform/SKILL.md',
  'packages/ai/ai-task-contract.md',
] as const;

export const AI_TASK_REQUIRED_OUTPUTS = [
  'ruleFilesRead',
  'contextFilesRead',
  'projectKey',
  'workflowState',
  'testPlanReference',
  'filesChanged',
  'commandsExecuted',
  'testResults',
  'risks',
  'openQuestions',
  'recommendedNextStep',
] as const;

export type AiTaskIntent =
  | 'framework-bootstrap'
  | 'run-qc'
  | 'generate-test-plan'
  | 'generate-tests'
  | 'auth-bootstrap';

export type AiTaskWorkflowState =
  | 'framework-bootstrap'
  | 'project-missing'
  | 'context-required'
  | 'review-required'
  | 'auth-bootstrap-required'
  | 'ready-for-qc';

export interface AiTaskContractInput {
  intent: AiTaskIntent;
  requestSummary: string;
  environment?: string;
  projectKey?: string;
  projectExists: boolean;
  contextFilesPresent: number;
  contextFilesRequired: number;
  reviewedTestPlanExists: boolean;
  allowTemporaryExploratoryTests: boolean;
  requiresAuth: boolean;
  authStateValid: boolean;
}

export interface AiTaskContractValidationResult {
  valid: boolean;
  environment: ProjectEnvironment;
  workflowState: AiTaskWorkflowState;
  issues: string[];
}

export function resolveAiTaskWorkflowState(
  input: AiTaskContractInput
): AiTaskWorkflowState {
  if (input.intent === 'framework-bootstrap') {
    return 'framework-bootstrap';
  }

  if (!input.projectExists) {
    return 'project-missing';
  }

  if (input.contextFilesPresent < input.contextFilesRequired) {
    return 'context-required';
  }

  if (input.requiresAuth && !input.authStateValid) {
    return 'auth-bootstrap-required';
  }

  if (!input.reviewedTestPlanExists && !input.allowTemporaryExploratoryTests) {
    return 'review-required';
  }

  return 'ready-for-qc';
}

export function validateAiTaskContract(
  input: AiTaskContractInput
): AiTaskContractValidationResult {
  const issues: string[] = [];
  const environment = normalizeProjectEnvironment(input.environment);
  const workflowState = resolveAiTaskWorkflowState(input);

  if (!input.requestSummary.trim()) {
    issues.push('requestSummary is required.');
  }

  if (input.intent !== 'framework-bootstrap' && !input.projectKey?.trim()) {
    issues.push('projectKey is required for project-scoped AI tasks.');
  }

  if (input.contextFilesRequired < 0 || input.contextFilesPresent < 0) {
    issues.push('context file counts cannot be negative.');
  }

  if (input.contextFilesPresent > input.contextFilesRequired) {
    issues.push('contextFilesPresent cannot exceed contextFilesRequired.');
  }

  if (
    input.intent === 'generate-tests' &&
    !input.reviewedTestPlanExists &&
    !input.allowTemporaryExploratoryTests
  ) {
    issues.push(
      'generate-tests requires a reviewed test plan unless the user explicitly allows temporary exploratory tests.'
    );
  }

  if (environment === 'production-smoke' && input.allowTemporaryExploratoryTests) {
    issues.push('Temporary exploratory tests are not allowed in production-smoke.');
  }

  if (workflowState === 'auth-bootstrap-required' && !input.requiresAuth) {
    issues.push('Workflow state and auth requirement flags are inconsistent.');
  }

  return {
    valid: issues.length === 0,
    environment,
    workflowState,
    issues,
  };
}

export function formatAiTaskContractValidation(
  result: AiTaskContractValidationResult
): string {
  const lines: string[] = [];
  lines.push('AI Task Contract:');
  lines.push(`  Environment: ${result.environment}`);
  lines.push(`  Workflow State: ${result.workflowState}`);
  lines.push(`  Valid: ${result.valid}`);

  if (result.issues.length > 0) {
    lines.push('  Issues:');
    for (const issue of result.issues) {
      lines.push(`    - ${issue}`);
    }
  }

  return lines.join('\n');
}
