# QC Skill — AI-native QC Workflow

This skill defines **how AI executes QC**. It is not a test repository.

## Simple QC Execution Workflow

For:

`按照 AGENTS.md 的规范，执行 hiring QC。`

The QC Agent must:

1. Parse the command.
2. Detect `PROJECT_KEY`.
3. Resolve the project space.
4. Resolve project config.
5. Resolve auth config.
6. Check auth state.
7. Bootstrap local auth if needed.
8. Read context.
9. Read the reviewed test plan.
10. Select tests.
11. Execute QC or prepare the governed command.
12. Analyze failures.
13. Suggest healing.
14. Produce a report.

## Minimum Safe Workflow

Even if the user asks to add tests directly, the agent must:

1. Check context.
2. Generate or locate a test plan.
3. Check reviewed status.
4. Refuse to generate long-term tests without a reviewed test plan.
5. Offer temporary exploratory tests only if the user explicitly allows them.

## Auth Handling Workflow

1. `local`: manual auth bootstrap allowed.
2. `CI`: manual auth forbidden.
3. `staging`: env or preseeded auth.
4. `production-smoke`: readonly only.
5. Never ask for secret values.

## Healer Rules

Allowed:

- `selector_update`
- `wait_strategy`
- `test_data_fix`
- `fixture_fix`
- `client_fix`
- `assertion_message_improvement`
- `split_flaky_test`

Forbidden:

- `remove_assertion`
- `weaken_assertion`
- `skip_failed_test`
- `change_business_logic_to_pass`
