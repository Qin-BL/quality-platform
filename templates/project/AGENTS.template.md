# Project AGENTS — __PROJECT_KEY__

This directory is the concrete business-system QC space for `__PROJECT_KEY__`.

## Project Rules

1. This project space does not replace unit or integration tests owned by the product repository.
2. Fill context before generating tests.
3. Do not fabricate tests without business context.
4. Reviewed test plan is required before long-term test generation.
5. UI logic belongs in `tests/` plus reusable `packages/pages/`.
6. API logic belongs in reusable `packages/clients/`.
7. Data setup belongs in reusable `packages/fixtures/`.
8. Assertions belong in reusable `packages/assertions/`.
9. Production is readonly only.
