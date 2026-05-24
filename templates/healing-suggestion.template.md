# Healing Suggestion — {{TEST_NAME}}

> **Suggested:** {{DATE}}
> **Status:** Suggested | Approved | Rejected | Applied

---

## Failure Reference

[Link to the failure analysis or test failure.]

---

## Suggested Fix

[Detailed description of the suggested fix.]

---

## Allowed Fix Type

- [ ] selector_update
- [ ] wait_strategy
- [ ] test_data_fix
- [ ] fixture_fix
- [ ] client_fix
- [ ] assertion_message_improvement
- [ ] split_flaky_test

## Not Allowed Fix Types (DO NOT USE)

- [ ] remove_assertion — **FORBIDDEN**
- [ ] weaken_assertion — **FORBIDDEN**
- [ ] skip_failed_test — **FORBIDDEN**
- [ ] change_business_logic_to_pass — **FORBIDDEN**

---

## Risk

- [ ] Low — minor change, unlikely to cause new issues
- [ ] Medium — moderate change, should be reviewed carefully
- [ ] High — significant change, requires explicit approval

---

## Requires Human Approval?

- [ ] Yes — must be reviewed before applying
- [ ] No — can be applied with standard review

---

## Before / After

### Before (current code)
```
{{CURRENT_CODE}}
```

### After (suggested code)
```
{{SUGGESTED_CODE}}
```

---

## Reviewer Notes

[Any additional context for the reviewer.]