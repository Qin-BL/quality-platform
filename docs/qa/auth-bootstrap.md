# Auth Bootstrap

Modes:

- `manual`
- `env`
- `preseeded`

## Bootstrap Overview

::: mermaid
graph TD
    A["Resolve auth config"] --> B["Determine auth mode"]
    B --> C["Check auth state"]
    C --> D{"Valid auth state?"}
    D -->|yes| E["Reuse auth state"]
    D -->|no| F["Run mode-specific bootstrap"]
    F --> G["Validate auth state again"]
    G --> H["Continue QC workflow"]
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef output fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A,B,C,F,G runtime;
    class D decision;
    class E,H output;
:::

## Mode Selection

::: mermaid
graph TD
    A["Auth mode"] --> B["manual"]
    A --> C["env"]
    A --> D["preseeded"]
    B --> E["Open login page and wait for user"]
    C --> F["Read local or CI credentials"]
    D --> G["Reuse provisioned auth state"]
    classDef mode fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef action fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    class A,B,C,D mode;
    class E,F,G action;
:::

## Local First Login

1. Resolve auth config
2. Check auth state
3. Reuse when valid
4. Open login page in a headed browser when manual bootstrap is needed
5. Wait for user login
6. Save `storageState`

## Local Manual Bootstrap

::: mermaid
graph TD
    A["Resolve local auth config"] --> B["Check local auth state"]
    B --> C{"Valid?"}
    C -->|yes| D["Reuse storageState"]
    C -->|no| E["Open headed browser"]
    E --> F["Wait for manual login"]
    F --> G["Detect success URL or authenticated page"]
    G --> H["Save storageState"]
    H --> I["Resume QC"]
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef output fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A,B,E,F,G,H runtime;
    class C decision;
    class D,I output;
:::

## Safety

- Auth state is sensitive
- Auth state must never be committed
- CI must not use manual auth
- `production-smoke` stays readonly
- If an auth configuration value is missing, ask for only that value and continue the same bootstrap flow after it is provided
- If the user provides a secret, store it only in `.secrets/<project-key>/<TEST_ENV>.local.json`
- Never echo stored secrets back into chat, logs, reports, or tracked files

## Missing Auth Input Recovery

::: mermaid
graph TD
    A["Missing auth value detected"] --> B["Write blocked-state file"]
    B --> C["Ask only for the missing value"]
    C --> D["Store local secret if sensitive"]
    D --> E["Resume the same bootstrap step"]
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    classDef action fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    class A warning;
    class B,C,D,E action;
:::

## Safety Boundaries

- `manual` is allowed only for local and interactive workflows
- `CI` must not depend on manual login
- `production-smoke` remains readonly
- local auth state and local secret files are runtime assets, not tracked assets
