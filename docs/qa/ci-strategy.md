# CI Strategy

## Overview

quality-platform tests run in CI at different stages of the development lifecycle, from PR to production.

## CI Triggers by Environment

### Business Project PR

| Trigger | Test Level | Environment | Purpose |
|---------|-----------|-------------|---------|
| PR opened | Smoke + relevant E2E | Staging | Verify PR doesn't break critical flows |
| PR updated | Smoke | Staging | Quick re-check |
| PR merged | Smoke + E2E + External | Staging | Full verification before deploy |

### quality-platform PR

| Trigger | Test Level | Environment | Purpose |
|---------|-----------|-------------|---------|
| PR opened | Lint + Typecheck + validate:structure | N/A | Framework integrity |
| PR updated | Lint + Typecheck | N/A | Quick re-check |

### Staging Deploy

| Trigger | Test Level | Environment | Purpose |
|---------|-----------|-------------|---------|
| Deploy to staging | Smoke + E2E + API + External | Staging | Full staging verification |

### Release

| Trigger | Test Level | Environment | Purpose |
|---------|-----------|-------------|---------|
| Pre-release | Smoke + Critical E2E + External | Staging | Release readiness check |
| Post-release | Smoke | Production | Verify release deployed correctly |

### Production

| Trigger | Test Level | Environment | Purpose |
|---------|-----------|-------------|---------|
| Scheduled (daily) | Production smoke | Production | Readonly health check |
| On-demand | Production smoke | Production | Readonly health check |

## CI Configuration

quality-platform uses:

- `playwright.config.ts` for test configuration
- Environment variables for all environment-specific settings
- Tags for test selection (`@smoke`, `@e2e`, `@api`, `@external`, `@visual`)

## CI Pipeline Example

```yaml
# Example Azure DevOps / GitHub Actions pipeline step
steps:
  - name: Install dependencies
    run: npm ci

  - name: Typecheck
    run: npm run typecheck

  - name: Validate structure
    run: npm run validate:structure

  - name: Run smoke tests
    run: npm run test:smoke
    env:
      TEST_ENV: staging
      APP_BASE_URL: ${{ secrets.STAGING_APP_URL }}
      API_BASE_URL: ${{ secrets.STAGING_API_URL }}

  - name: Upload report
    if: always()
    uses: actions/upload-artifact@v4
    with:
      name: playwright-report
      path: playwright-report/
```

## Production Safety in CI

- `ALLOW_PRODUCTION_WRITE` is ALWAYS `false` in CI.
- `ALLOW_PRODUCTION_READONLY` is `true` only in the production smoke job.
- Production smoke job uses a dedicated service connection with readonly permissions.