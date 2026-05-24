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
- If an auth configuration value is missing, ask for only that value and continue the same bootstrap flow after it is provided
- If the user provides a secret, store it only in `.secrets/<project-key>/<TEST_ENV>.local.json`
- Never echo stored secrets back into chat, logs, reports, or tracked files
