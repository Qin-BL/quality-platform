# AI Task State Machine

```text
NO_PROJECT_SPACE
→ PROJECT_SPACE_CREATED
→ CONTEXT_READY
→ IMPACT_ANALYZED
→ TEST_PLAN_GENERATED
→ TEST_PLAN_REVIEWED
→ TESTS_GENERATED
→ TESTS_REVIEWED
→ TESTS_PROMOTED
→ TESTS_MAINTAINED
```

## Rules

1. Without a reviewed test plan, long-term tests cannot be generated.
2. Generated tests cannot be promoted directly.
3. Production write is forbidden by default.
4. Every AI final output must report the current state and the next recommended state.
