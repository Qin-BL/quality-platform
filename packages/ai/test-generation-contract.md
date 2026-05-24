# Test Generation Contract

> **This document defines the contract AI must follow when generating test code.**
> AI agents: read this before generating any test file.

---

## 1. Input Requirements

Before generating ANY test code, AI MUST have:

1. A **reviewed test plan** in `projects/<project-key>/test-plans/reviewed/`
2. All **context documents** filled in under `projects/<project-key>/context/`
3. **Business project source code** available and understood

**AI MUST NOT generate tests without ALL three inputs.**

---

## 2. Output Contract

Generated test files MUST:

### Structure
- Use the correct template from `templates/`
- Follow the test directory structure (`smoke/`, `e2e/`, `api/`, `external/`, `visual/`)
- Import from `packages/`, not inline helpers

### Dependencies
- Page objects: extend `BasePage` from `packages/pages/base-page.ts`
- API clients: extend `BaseHttpClient` or use the appropriate client base
- Test data: use factories from `packages/fixtures/test-data-factory.base.ts`
- Assertions: extend base classes from `packages/assertions/`
- Configuration: use `requireEnv()` from `packages/core/env.ts`

### Tags
Every test MUST include a Playwright tag:
- `@smoke` for smoke tests
- `@e2e` for E2E tests
- `@api` for API tests
- `@external` for external system tests
- `@visual` for visual tests

### Environment
- All URLs from environment variables — NEVER hardcoded
- All credentials from environment variables — NEVER hardcoded
- Production safety checks for external system tests

---

## 3. Quality Requirements

1. Generated tests MUST be syntactically correct TypeScript
2. Generated tests MUST be executable by Playwright
3. Generated tests MUST have clear `test()` descriptions
4. Generated tests MUST include error handling for external calls
5. All assertions MUST have descriptive error messages

---

## 4. What AI MUST NOT Do

1. **NO** fabrication of business rules not in context documents
2. **NO** hardcoded URLs, credentials, or business selectors
3. **NO** complex business logic inside test specs — use packages
4. **NO** tests that mutate production data
5. **NO** tests without proper tags
6. **NO** tests that skip critical assertions
7. **NO** tests generated without a reviewed test plan

---

## 5. Verification Checklist

After generating tests, AI MUST verify:

- [ ] All imports resolve correctly
- [ ] All required templates were used
- [ ] Tags are present on every test
- [ ] No hardcoded secrets or URLs
- [ ] Environment variables are used for configuration
- [ ] Error handling is present for external calls
- [ ] Test descriptions are clear and descriptive