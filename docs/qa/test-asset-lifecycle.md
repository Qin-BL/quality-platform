# Test Asset Lifecycle

`generated -> reviewed -> promoted -> deprecated`

## Lifecycle Overview

::: mermaid
graph TD
    A["Generated"] --> B["Reviewed"]
    B --> C["Promoted"]
    C --> D["Deprecated"]
    classDef generated fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef reviewed fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef promoted fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    classDef deprecated fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    class A generated;
    class B reviewed;
    class C promoted;
    class D deprecated;
:::

Rules:

1. Generated tests are not CI-ready.
2. Reviewed tests are human-validated candidates.
3. Promoted tests are regression assets.
4. Generated tests cannot be promoted directly.

## Promotion Gate

::: mermaid
graph TD
    A["Generated asset"] --> B{"Human reviewed?"}
    B -->|no| C["Stay in generated or rework"]
    B -->|yes| D["Move to reviewed"]
    D --> E{"Stable and accepted?"}
    E -->|no| F["Revise or retire"]
    E -->|yes| G["Promote to regression asset"]
    classDef generated fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef promoted fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    classDef deprecated fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    class A,C,D generated;
    class B,E decision;
    class G promoted;
    class F deprecated;
:::

## Asset Types

- `generated`: AI-produced drafts or candidates
- `reviewed`: human-validated assets ready for limited adoption
- `promoted`: durable regression assets expected to run in governed QC
- `deprecated`: assets intentionally retired or replaced

## Practical Meaning

- generated assets can be useful, but they are not yet trustworthy enough for long-term regression
- reviewed assets are the checkpoint where human understanding enters the lifecycle
- promoted assets become part of the maintained QC surface
- deprecated assets preserve history while making room for cleaner successors

## Lifecycle Guardrails

::: mermaid
graph TD
    A["Generated test"] --> B{"Direct promotion?"}
    B -->|yes| C["Blocked by governance"]
    B -->|no| D["Require review path"]
    D --> E["Reviewed test"]
    E --> F["Promoted test"]
    F --> G["Later deprecate if obsolete"]
    classDef generated fill:#eef6ff,stroke:#4a90e2,color:#16324f,stroke-width:1.5px;
    classDef decision fill:#fff7e6,stroke:#d48806,color:#5b3a00,stroke-width:1.5px;
    classDef warning fill:#fff1f0,stroke:#d64545,color:#5c1d1d,stroke-width:1.5px;
    classDef lifecycle fill:#eefbf3,stroke:#2f9e44,color:#16351f,stroke-width:1.5px;
    class A,D,E generated;
    class B decision;
    class C warning;
    class F,G lifecycle;
:::
