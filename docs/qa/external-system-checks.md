# External System Checks

## Overview

External system checks verify that data and state are consistent between the application under test and integrated external systems (ATS, calendar, email, design systems, etc.).

## Principles

1. **Sandbox/staging first** — Always prefer sandbox or staging environments for external tests.
2. **Production readonly only** — Production checks must be read-only (no mutations).
3. **Isolate test data** — Use test-specific identifiers that can be cleaned up.
4. **Fail gracefully** — External systems may be unavailable; handle timeouts and errors.

## Environment Strategy

| System Type | Local | Staging | Production |
|-------------|-------|---------|------------|
| ATS / CRM | Mock or sandbox | Staging account | Readonly smoke |
| Calendar | Test calendar | Staging calendar | Readonly smoke |
| Email | Mailtrap / Mailhog | Test email service | Reaodnly smoke |
| Design System | Local screenshots | Figma dev mode | N/A |

## Safety Checks

Before ANY external system interaction:

1. Verify `ALLOW_PRODUCTION_READONLY` and `ALLOW_PRODUCTION_WRITE` flags.
2. Confirm environment via `TEST_ENV` variable.
3. Validate that external system credentials are configured.
4. Check connectivity before running tests.
5. Log all external system interactions.

## Verification Flow

```
Check environment (local/staging/production)
    ↓
Verify safety flags (ALLOW_PRODUCTION_WRITE must be false)
    ↓
Validate external system credentials
    ↓
Test connectivity (ping / health check)
    ↓
Execute verification tests
    ↓
Report results with clear pass/fail/not-checked status
```

## What to Verify

1. **Data consistency** — Does data match between app and external system?
2. **Sync timing** — Does data sync within expected time windows?
3. **Error handling** — Does the app handle external system failures gracefully?
4. **Auth/Token validity** — Are credentials working and not expired?

## Production Rules

- `ALLOW_PRODUCTION_WRITE` MUST be `false`.
- `ALLOW_PRODUCTION_READONLY` MUST be explicitly set to `true`.
- Only smoke-level checks: verify connectivity, verify critical data exists.
- No data creation, modification, or deletion.
- All production checks must be idempotent and safe to re-run.