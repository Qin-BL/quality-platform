# Flaky Test Policy

> **Phase 1: Policy definition. Applied when tests are executed.**

---

## 1. What is a Flaky Test?

A flaky test is one that **passes sometimes and fails other times without any code changes**.

Characteristics:
- Inconsistent pass/fail pattern
- Often related to timing, ordering, or shared state
- NOT caused by real product bugs or environment outages

---

## 2. Detection Rules

A test is flagged as flaky when:

1. It fails on one run and passes on the next **with no code changes**.
2. It fails with **timeout or wait-related errors**.
3. Playwright retries cause it to pass (indicating a timing issue).
4. It fails inconsistently across CI runs.

---

## 3. How to Handle Flaky Tests

### Immediate Action (Phase 1)
1. Classify the failure as `flaky` using `failure-classifier.ts`.
2. Record in failure report.
3. Do NOT skip — instead flag for review.

### Investigation (Phase 2+)
1. Check if the test has shared state with other tests.
2. Check if the test relies on timing (`waitForTimeout` without condition).
3. Check if external dependencies are inconsistent.
4. Check if test data is being modified by other tests.

### Allowed Fixes
- Add explicit wait conditions (`waitForSelector`, `waitForResponse`)
- Split large test into smaller, focused tests
- Isolate test data per test run
- Use `test.describe.configure({ mode: 'serial' })` only when necessary

### Forbidden Fixes
- **DO NOT** skip the test without documentation
- **DO NOT** remove assertions to make it pass
- **DO NOT** weaken expected results
- **DO NOT** add arbitrary `waitForTimeout(5000)` as a permanent fix
- **DO NOT** mark as `test.fixme()` without a ticket

---

## 4. Flaky Test Lifecycle

```
Detected as flaky
    ↓
Classified by Healer Agent
    ↓
Flagged in test-execution report
    ↓
Human reviews and decides action
    ↓
Fix applied (wait strategy, split, isolation)
    ↓
Re-evaluated over next N CI runs
    ↓
If stable → stays in suite
    ↓
If still flaky → escalated for deeper investigation
```

---

## 5. Reporting

Flaky tests appear in:
- **Execution summary** — marked as `flaky`
- **Healing suggestions** — with `split_flaky_test` or `wait_strategy` suggestions
- **QC report** — failure classification section

---

## 6. CI Policy

- Flaky tests do NOT block release by themselves.
- If flaky + real failures exist, flaky tests are still reported but separately.
- Flaky tests are tracked over time for trend analysis.

---

*Phase 1: Policy definition. Actual detection and handling in Phase 2+.*