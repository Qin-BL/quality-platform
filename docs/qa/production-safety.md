# Production Safety

1. `production-smoke` is readonly only.
2. `ALLOW_PRODUCTION_WRITE=false` by default.
3. `guard-production` checks production safety independently.
4. Auth state does not bypass production safety.
