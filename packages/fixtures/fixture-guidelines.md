# Fixture / Test Data Factory Guidelines

## Core Principles

1. **Factory pattern** — Use factories to create test data objects, not manual inline construction.
2. **Default values** — Factories provide sensible defaults for all required fields.
3. **Override pattern** — Allow partial overrides via `Partial<T>` parameters.
4. **No hardcoded business data** — Factories should be generic; project-specific factories go in `projects/<project-key>/`.
5. **Cleanup awareness** — Factories should mark test data for cleanup when applicable.

## Example Structure

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function createUser(overrides?: Partial<User>): User {
  return {
    id: `test-user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    role: 'user',
    ...overrides,
  };
}
```

## Guidelines

1. Name factories `createXxx()`.
2. Prefix test identifiers with `test-` or `qc-` for easy cleanup.
3. Use timestamps or UUIDs for unique values to avoid collisions.
4. Export both the type and the factory.