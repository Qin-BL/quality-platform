# QC Skill — AI-native QC Workflow

This skill defines **how AI executes QC**. It is not a test repository.

It does not authorize writing unit tests for internal business-project code. Those tests belong in the corresponding product or service repository.

## Simple QC Execution Workflow

For:

`按照 AGENTS.md 的规范，执行 hiring QC。`

The QC Agent must:

1. Parse the command.
2. Detect `PROJECT_KEY`.
3. Resolve the project space.
4. Resolve project config.
5. Run the configured unit-test gate first when the target system has existing unit tests.
6. Stop the workflow if the required unit-test gate fails.
7. Resolve auth config.
8. Check auth state.
9. Bootstrap local auth if needed.
10. Read context.
11. Read the reviewed test plan.
12. Select tests.
13. Execute QC or prepare the governed command.
14. Analyze failures.
15. Suggest healing.
16. Produce a report.

## Minimum Safe Workflow

Even if the user asks to add tests directly, the agent must:

1. Check context.
2. Generate or locate a test plan.
3. Check reviewed status.
4. Refuse to generate long-term tests without a reviewed test plan.
5. Offer temporary exploratory tests only if the user explicitly allows them.

## Missing Configuration Workflow

When required configuration is missing before or during QC:

1. Identify the exact missing item.
2. Ask the user only for that item.
3. If the user provides a sensitive value, save it only to the local Git-ignored secret config file for that project and environment.
4. Do not print the sensitive value back to the user.
5. After the user provides the missing configuration, continue the interrupted workflow instead of restarting from scratch.

## Auth Handling Workflow

1. `local`: manual auth bootstrap allowed.
2. `CI`: manual auth forbidden.
3. `staging`: env or preseeded auth.
4. `production-smoke`: readonly only.
5. Sensitive values may be accepted only for local Git-ignored config storage, never for tracked files.

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
