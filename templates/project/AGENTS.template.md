# Project AGENTS — __PROJECT_KEY__

This directory is the concrete business-system QC space for `__PROJECT_KEY__`.

## Project Rules

1. This project space does not replace unit or integration tests owned by the product repository.
2. Do not use this QC project space to write unit tests for internal business code.
3. Fill context before generating tests.
4. Do not fabricate tests without business context.
5. Reviewed test plan is required before long-term test generation.
6. UI logic belongs in `tests/` plus reusable `packages/pages/`.
7. API logic belongs in reusable `packages/clients/`.
8. Data setup belongs in reusable `packages/fixtures/`.
9. Assertions belong in reusable `packages/assertions/`.
10. Production is readonly only.
