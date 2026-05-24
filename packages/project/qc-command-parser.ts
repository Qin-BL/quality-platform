import { detectProjectKeyFromText } from './project-discovery';

export type QCCommandIntent =
  | 'run_qc'
  | 'add_business_tests'
  | 'generate_test_plan'
  | 'generate_tests_from_reviewed_plan'
  | 'auth_bootstrap'
  | 'analyze_failure'
  | 'unknown';

export interface QCCommand {
  intent: QCCommandIntent;
  projectKey: string | undefined;
  environment: string;
  allowTemporaryExploratoryTests: boolean;
  requiresReviewedTestPlan: boolean;
  rawText: string;
}

const DEFAULT_ENV = 'local';

export function parseQCCommand(input: string): QCCommand {
  const projectKey = detectProjectKeyFromText(input);
  const intent = detectIntent(input);
  const env = process.env.TEST_ENV || DEFAULT_ENV;

  return {
    intent,
    projectKey,
    environment: env,
    allowTemporaryExploratoryTests: intent !== 'run_qc',
    requiresReviewedTestPlan: intent === 'run_qc' || intent === 'add_business_tests' || intent === 'generate_tests_from_reviewed_plan',
    rawText: input,
  };
}

function detectIntent(input: string): QCCommandIntent {
  const lower = input.toLowerCase();

  if (/执行.*qc|run.*qc|执行.*测试/.test(lower) && !/添加/.test(lower) && !/生成/.test(lower)) {
    return 'run_qc';
  }

  if (/添加.*业务测试|add.*business.*test/.test(lower)) {
    return 'add_business_tests';
  }

  if (/生成.*test.?plan|generate.*test.?plan/.test(lower)) {
    return 'generate_test_plan';
  }

  if (/基于.*reviewed.*test.?plan.*生成|generate.*from.*reviewed/.test(lower)) {
    return 'generate_tests_from_reviewed_plan';
  }

  if (/登录|auth.*bootstrap|login/.test(lower)) {
    return 'auth_bootstrap';
  }

  if (/分析.*失败|analyze.*failure|healing/.test(lower)) {
    return 'analyze_failure';
  }

  return 'unknown';
}

export function formatCommandResult(cmd: QCCommand): string {
  const parts: string[] = [];
  parts.push(`Intent: ${cmd.intent}`);
  parts.push(`Project Key: ${cmd.projectKey || '(not detected)'}`);
  parts.push(`Environment: ${cmd.environment}`);
  parts.push(`Requires Reviewed Test Plan: ${cmd.requiresReviewedTestPlan}`);
  parts.push(`Temporary Exploratory Allowed: ${cmd.allowTemporaryExploratoryTests}`);
  return parts.join('\n');
}