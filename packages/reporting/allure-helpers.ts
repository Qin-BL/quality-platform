/**
 * Allure report helpers.
 *
 * These helpers assist with Allure report generation and customization.
 * Allure is configured in playwright.config.ts via the allure-playwright reporter.
 *
 * Usage:
 *   npm run report:allure
 *
 * This generates allure-results/ from test runs and opens the Allure report.
 */

export function getAllureCommand(): string {
  return 'allure generate ./allure-results -o ./allure-report --clean && allure open ./allure-report';
}

export function getAllureReportDir(): string {
  return './allure-report';
}

export function getAllureResultsDir(): string {
  return './allure-results';
}