# Impact Analysis Template

> **Use this template to document the impact of code changes on test coverage.**

---

## Change Summary

- **PR / Release:** [...]
- **Date:** [...]
- **Author:** [...]

---

## Files Changed

| File | Type (UI/API/Logic/Config) | Risk |
|------|---------------------------|------|
| ...  | ...                       | Low/Medium/High |

---

## Impact Assessment

### Frontend Impact

- Affected routes: [...]
- Affected pages/components: [...]
- UI state changes: [...]
- Visual changes: [...]

### Backend Impact

- Affected endpoints: [...]
- Affected domains/models: [...]
- Affected background jobs: [...]
- Affected webhooks: [...]

### External System Impact

- Affected integrations: [...]
- Data flow changes: [...]
- New external dependencies: [...]

---

## Test Selection

Based on impact analysis, the following test levels are selected:

| Test Level | Reason | Priority |
|------------|--------|----------|
| Smoke | ... | ... |
| E2E | ... | ... |
| API | ... | ... |
| External | ... | ... |
| Visual | ... | ... |

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| ...  | ...        | ...    | ...        |

---

## Recommended Test Plan

- Use existing plan: [...]
- Generate new plan: [Yes/No]
- Plan scope: [...]