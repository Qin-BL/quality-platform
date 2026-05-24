# Project Config Discovery

Priority:

1. `projects/<PROJECT_KEY>/config/<TEST_ENV>.ts`
2. `projects/<PROJECT_KEY>/config/project.config.ts`
3. Environment variables
4. Safe defaults

This standardized layout is why users should not need to repeat where auth config, context, tests, or reviewed plans live.

If discovery still cannot find a required configuration item, AI should ask the user only for that missing item and then continue with the same workflow.
If the user provides a sensitive value, AI should save it only to `.secrets/<project-key>/<TEST_ENV>.local.json` and then continue.
