# Production Safety

1. `production-smoke` is readonly only.
2. `ALLOW_PRODUCTION_WRITE=false` by default.
3. `guard-production` checks production safety independently.
4. Auth state does not bypass production safety.

## Safety Model

::: mermaid
graph TD
    A["Requested action"] --> B["Resolve environment"]
    B --> C{"production-smoke?"}
    C -->|yes| D["Readonly boundary"]
    C -->|no| E["Normal governed environment rules"]
    D --> F["Block write behavior"]
    F --> G["Allow readonly smoke only"]
    classDef input fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    class A input;
    class C decision;
    class B,E runtime;
    class D,F,G warning;
:::

## Production Guard Path

::: mermaid
graph TD
    A["QC or script request"] --> B["Check production flags"]
    B --> C{"ALLOW_PRODUCTION_WRITE=true?"}
    C -->|no| D["Proceed under readonly rules"]
    C -->|yes| E["Warn strongly and block by default"]
    E --> F["Require explicit human approval path"]
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    class A,B,D runtime;
    class C decision;
    class E,F warning;
:::

## Why Auth Does Not Bypass Safety

::: mermaid
graph TD
    A["Valid auth state"] --> B{"Safe to write?"}
    B -->|no| C["Still block production write"]
    B -->|yes, non-production or approved path| D["Continue governed workflow"]
    classDef runtime fill:#f5f3ff,stroke:#7c5cff,color:#221b4b,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    class A,D runtime;
    class B decision;
    class C warning;
:::

## Practical Rules

- production access is not the same as production permission
- readonly smoke checks are the default production posture
- auth bootstrap exists for access continuity, not for bypassing governance
- guard scripts remain authoritative even when auth state is valid
