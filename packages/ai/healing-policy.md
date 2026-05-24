# AI Healing Policy

> **Defines what AI (Healer Agent) can and cannot do when suggesting test fixes.**

---

## 1. Healing Philosophy

AI healing is **suggestion-based**, NOT automatic application. All suggestions require human review before being applied. The policy enforces strict boundaries to prevent test quality degradation.

---

## 2. Allowed Fix Types

| Fix Type | Description | Example |
|----------|-------------|---------|
| `selector_update` | Update element locator | Change from `.btn-primary` to `[data-testid="submit"]` |
| `wait_strategy` | Improve wait conditions | Replace `waitForTimeout(5000)` with `waitForSelector` |
| `test_data_fix` | Fix test data setup | Correct invalid fixture data |
| `fixture_fix` | Fix test fixture | Remove shared mutable state |
| `client_fix` | Fix API client | Update request body shape |
| `assertion_message_improvement` | Improve error messages | Add context to assertion error |
| `split_flaky_test` | Split unstable test | Break large test into focused tests |

---

## 3. Forbidden Fix Types

| Fix Type | Why Forbidden |
|----------|--------------|
| `remove_assertion` | Removes quality verification — NEVER acceptable |
| `weaken_assertion` | Reduces test confidence — violates quality standards |
| `skip_failed_test` | Hides failures instead of fixing them |
| `change_business_logic_to_pass` | Mutable business logic for test convenience — fundamentally wrong |

---

## 4. Human Approval Requirements

| Risk Level | Action |
|------------|--------|
| **Low** (selector update, message improvement) | Can be suggested; human reviews at their pace |
| **Medium** (wait strategy, data fix, client fix) | Requires human review before applying |
| **High** (split test, significant refactor) | Requires explicit human approval + explanation |

---

## 5. Audit

All healing suggestions:
1. Must be recorded in the audit trail
2. Must include the original failure and the suggested fix
3. Must be marked as "suggested" until human-approved
4. Must never be auto-applied

---

*Phase 1: Policy definition. AI healing not yet active.*