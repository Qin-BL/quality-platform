# Simple QC Command

Example:

`按照 AGENTS.md 的规范，执行 hiring QC。`

## Expansion

1. Detect `PROJECT_KEY=hiring`
2. Read governance files
3. Resolve project space and config
4. Resolve auth config and auth state
5. Bootstrap local auth when needed
6. Read context
7. Read reviewed test plan
8. Select tests
9. Run or prepare QC
10. Produce a QC report

## When More Input Is Needed

- The project key cannot be detected
- The project space does not exist
- Context is too incomplete for safe planning
- Human review is required for a draft plan
- A required non-secret configuration item is missing

When this happens, AI should ask only for the missing item and resume the interrupted workflow after the answer is provided.
