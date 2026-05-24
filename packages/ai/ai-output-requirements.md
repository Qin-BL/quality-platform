# AI Output Requirements

> **Defines the standard output format for all AI QC tasks.**

---

## Required Summary

Every AI task output must include:

| Field | Description |
|-------|-------------|
| **Project key** | The project being tested |
| **Request** | User request or QC trigger summary |
| **Current state** | State machine state at task end |
| **Next state** | Expected next state and what triggers it |
| **Rule files read** | AGENTS.md, SKILL.md, ai-task-contract.md, etc. |
| **Context files read** | Which context documents were consulted |
| **Test plan used** | Path to reviewed test plan (or "generated new: path") |
| **Files changed** | Complete list of created/modified files |
| **Commands executed** | What was run and key results |
| **Results** | Test pass/fail/skip, or "not executed" |
| **Risks** | Anything uncertain, not verified, or missing |
| **Open questions** | Unresolved business rules |
| **Next step** | Recommended action for human or next AI cycle |

---

## If Context Was Missing

When project context is incomplete, AI must report:

```markdown
## Context Status

### Missing Files
- [file]: [reason missing or what is unknown]

### Added
- [file]: [summary of what was added]

### Still Unknown
- [topic]: [what remains uncertain]

### Blocked?
- YES / NO — test generation is [blocked / can proceed conditionally]
```

---

## If Test Plan Was Generated

When AI generates a new test plan, it must report:

```markdown
## Test Plan Generated

- **Path:** `test-plans/generated/<filename>.md`
- **Scope:** [what it covers]
- **Assumptions:** [list of assumptions made]
- **Open Questions:** [unresolved business rules]
- **Review Required:** YES — human must review before test generation
```

---

## If Tests Were Generated

When AI generates tests from a reviewed plan, it must report:

```markdown
## Tests Generated

- **Reviewed test plan:** [path]
- **Test files generated:** [list]
- **Page objects generated:** [list]
- **Clients generated:** [list]
- **Fixtures generated:** [list]
- **Assertions generated:** [list]
- **Commands executed:** [npm run typecheck, npm run ai:check, etc.]
- **Test result:** [pass/fail/skip counts or "not yet executed"]
- **Asset status:** generated / reviewed / promoted
```

---

## If Tests Failed

When tests fail, AI must report:

```markdown
## Failure Report

### Failure Summary
- Total failures: N
- Classification breakdown:
  - product_bug: N
  - test_bug: N
  - environment_issue: N
  - flaky: N
  - data_issue: N
  - external_dependency: N
  - unknown: N

### Detailed Failures
| Test | Type | Root Cause | Evidence |
|------|------|-----------|----------|

### Healing Suggestions
| Test | Suggestion | Fix Type | Allowed? | Risk |
|------|-----------|----------|----------|------|

### Forbidden Fixes Avoided
- [list any forbidden fix types that were considered and rejected]

### Human Approval Required?
- [YES/NO — and for which suggestions]
```

---

## Final Checklist

Before considering an AI task complete, verify:

- [ ] All required output sections are present
- [ ] Current state and next state are reported
- [ ] Risks and open questions are documented
- [ ] No business rules were fabricated
- [ ] No secrets were hardcoded
- [ ] No production write was introduced
- [ ] Reviewed test plan was used for permanent tests
- [ ] Generated assets are NOT marked as promoted