# Test Asset Lifecycle

`generated -> reviewed -> promoted -> deprecated`

Rules:

1. Generated tests are not CI-ready.
2. Reviewed tests are human-validated candidates.
3. Promoted tests are regression assets.
4. Generated tests cannot be promoted directly.
