/**
 * guard-production.ts — Production safety guard script.
 *
 * Validates production safety:
 * - Checks TEST_ENV
 * - Checks ALLOW_PRODUCTION_READONLY
 * - Checks ALLOW_PRODUCTION_WRITE (MUST be false)
 * - Reports any violations
 *
 * This script can be run independently to verify production safety
 * before any test execution.
 *
 * Usage:
 *   npm run guard:production
 */

import { validateProductionSafety } from '../packages/core/guards.js';

function main(): void {
  console.log('==============================================');
  console.log('  Production Safety Guard Check');
  console.log('==============================================');
  console.log('');

  const result = validateProductionSafety();

  console.log(`Environment: ${result.environment}`);
  console.log(`Readonly Allowed: ${result.readonlyAllowed}`);
  console.log(`Write Allowed: ${result.writeAllowed}`);
  console.log('');

  if (result.isSafe) {
    console.log('✅ Safety check PASSED.');
    console.log('');
    if (result.environment === 'production-smoke') {
      console.log('⚠️  Running in PRODUCTION environment.');
      console.log('   - Readonly smoke tests ONLY.');
      console.log('   - ALL_PRODUCTION_WRITE is correctly set to false.');
      console.log('   - No data will be mutated.');
    } else {
      console.log('✅ Running in non-production environment.');
    }
    process.exit(0);
  }

  console.log('❌ SAFETY VIOLATIONS DETECTED:');
  console.log('');
  for (const violation of result.violations) {
    console.log(`   ${violation}`);
  }
  console.log('');
  console.log('❌ Safety check FAILED.');
  console.log('');
  console.log('Fix the violations above before proceeding. In particular:');
  console.log('  1. Set ALLOW_PRODUCTION_WRITE=false');
  console.log('  2. Ensure you are using sandbox/staging/test accounts');
  console.log('  3. Never use production credentials for testing');

  process.exit(1);
}

main();
