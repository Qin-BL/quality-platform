# Auth Bootstrap

Modes:

- `manual`
- `env`
- `preseeded`

## Local First Login

1. Resolve auth config
2. Check auth state
3. Reuse when valid
4. Open login page in a headed browser when manual bootstrap is needed
5. Wait for user login
6. Save `storageState`

## Safety

- Auth state is sensitive
- Auth state must never be committed
- CI must not use manual auth
- `production-smoke` stays readonly
