# Project Config Discovery

Priority:

1. `projects/<PROJECT_KEY>/config/<TEST_ENV>.ts`
2. `projects/<PROJECT_KEY>/config/project.config.ts`
3. Environment variables
4. Safe defaults

## Discovery Flow

::: mermaid
graph TD
    A["User request or CLI input"] --> B["Detect PROJECT_KEY"]
    B --> C["Resolve TEST_ENV"]
    C --> D["Check env-specific config"]
    D --> E["Check project base config"]
    E --> F["Check environment variables"]
    F --> G["Apply safe defaults"]
    G --> H["Resolved runtime config"]
    classDef input fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef output fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A input;
    class B,C,D,E,F,G runtime;
    class H output;
:::

## Discovery Order

::: mermaid
graph TD
    A["projects/<PROJECT_KEY>/config/<TEST_ENV>.ts"] --> B["projects/<PROJECT_KEY>/config/project.config.ts"]
    B --> C["Environment variables"]
    C --> D["Safe defaults"]
    classDef config fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef fallback fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    class A,B config;
    class C,D fallback;
:::

This standardized layout is why users should not need to repeat where auth config, context, tests, or reviewed plans live.

If discovery still cannot find a required configuration item, AI should ask the user only for that missing item and then continue with the same workflow.
If the user provides a sensitive value, AI should save it only to `.secrets/<project-key>/<TEST_ENV>.local.json` and then continue.

## What Discovery Resolves

- project root
- environment config
- auth settings
- context locations
- reviewed test plan locations
- tests directory
- report and trace destinations

## Missing Configuration Recovery

::: mermaid
graph TD
    A["Discovery cannot resolve a required value"] --> B["Write blocked-state file"]
    B --> C["Ask only for the missing item"]
    C --> D["Store local value if sensitive"]
    D --> E["Resume the interrupted workflow"]
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    classDef action fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    class A warning;
    class B,C,D,E action;
:::

## Why Users Should Not Need To Explain Paths

The repository layout is intentionally opinionated.
If a project follows the standard structure, the platform should already know where to find:

- auth config
- context files
- reviewed plans
- tests
- reports

Users should only need to provide missing values that cannot be inferred from repo structure or local config.
