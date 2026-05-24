# Auth Package

This package owns auth config discovery, auth state handling, auth guards, and auth bootstrap.

## Discovery Priority

1. Explicit config passed by the caller
2. Resolved project config from `projects/<project-key>/config/<TEST_ENV>.ts`
3. Resolved project config from `projects/<project-key>/config/project.config.ts`
4. Local secret config at `.secrets/<project-key>/<TEST_ENV>.local.json`
5. Environment variables
6. Safe defaults

## Rules

1. Auth state is sensitive and must never be committed.
2. Manual auth is allowed for local workflows only.
3. CI must use env or preseeded auth.
4. Production smoke remains readonly.
5. Sensitive values provided by the user may be stored only in local Git-ignored secret config files.

## Local Secret Config

Default path:

- `.secrets/<project-key>/<TEST_ENV>.local.json`

Example shape:

```json
{
  "auth": {
    "loginUrl": "https://placeholder-login.local",
    "testUserEmail": "<your-test-email>",
    "testUserPassword": "<your-test-password>",
    "authenticatedCheckUrl": "https://placeholder-app.local/session"
  }
}
```
