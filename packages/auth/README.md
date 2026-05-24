# Auth Package

This package owns auth config discovery, auth state handling, auth guards, and auth bootstrap.

## Discovery Priority

1. Explicit config passed by the caller
2. `projects/<project-key>/config/<TEST_ENV>.ts`
3. `projects/<project-key>/config/project.config.ts`
4. Environment variables
5. Safe defaults

## Rules

1. Auth state is sensitive and must never be committed.
2. Manual auth is allowed for local workflows only.
3. CI must use env or preseeded auth.
4. Production smoke remains readonly.
