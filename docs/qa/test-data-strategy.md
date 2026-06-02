# Test Data Strategy

## Core Principles

1. **Never use production data for testing.**
2. **All test data must be identifiable and cleanable.**
3. **Test data is created in isolation per test run.**

## Test Data Markers

All test data must carry identifiable markers to distinguish from real data:

- Prefix identifiers with `test-` or `qc-` (e.g., `test-user-abc123`, `qc-job-xyz`)
- Use unique suffixes based on timestamp + random string
- Use test-specific email domains (e.g., `@test.example.com`)
- Add metadata tags where the system supports it (e.g., `tag: "e2e-test"`)

## Data Creation

Test data should be created through:

1. **API calls** — Direct API calls to create test entities (preferred for API tests)
2. **UI flows** — Through the UI during E2E tests (for E2E scenarios)
3. **Factories** — Using `packages/fixtures/` factory functions (for consistent data shapes)

## Data Cleanup Strategy

### Automatic Cleanup

- Tests should clean up after themselves in `afterEach`/`afterAll` hooks.
- If cleanup fails, log a warning — do not fail the test for cleanup errors.
- External system data may not be cleanable via API; document this in the test plan.

### Manual Cleanup

- Scheduled cleanup jobs for orphaned test data
- Test data retention period: 24 hours for local, 7 days for staging
- Dashboard or script to identify and purge stale test data

### Production

- **Absolutely NO test data creation in production.**
- Readonly smoke tests only.
- If readonly smoke requires data, use existing (non-mutated) data only.

## Factory Pattern

```typescript
// packages/fixtures/test-data-factory.base.ts
export const createTestUser = (overrides?: Partial<User>) => ({
  email: `test-${Date.now()}@example.com`,
  name: 'QC Test User',
  ...overrides,
});
```

## Environment-Specific Rules

| Environment | Data Creation | Cleanup | Data Source |
|-------------|--------------|---------|-------------|
| Local | Allowed | Automatic | Factories + API |
| Staging | Allowed | Automatic | Factories + API |
| Production | FORBIDDEN | N/A | Readonly existing data |

## Orchestration Layer

Project config can now declare:

- environment readiness checks
- required data dependencies
- optional provision commands

Use:

`npm run orchestrate:test-env -- --project <project-key>`

This moves test-environment readiness and shared data expectations into governed configuration instead of scattering them across specs.
