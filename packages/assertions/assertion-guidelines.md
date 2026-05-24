# Assertion Guidelines

## Core Principles

1. **Named assertions** — Each assertion should be a named function or static method with a clear purpose.
2. **Descriptive error messages** — Assertions must provide clear, actionable error messages when they fail.
3. **Composable** — Assertions should be small and composable, not monolithic.
4. **Separate from tests** — Business assertions belong in `packages/assertions/`, not inline in test specs.
5. **Three categories** — API assertions, UI assertions, External system assertions.

## Naming Convention

- `expectXxx()` — For positive assertions (expect success, expect valid data)
- `expectXxxError()` — For error/negative assertions

## Example

```typescript
import { expect, APIResponse } from '@playwright/test';

export class OrderAssertions {
  static async expectValidOrder(response: APIResponse): Promise<void> {
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('status');
  }

  static async expectOrderError(response: APIResponse, expectedStatus: number, expectedCode: string): Promise<void> {
    expect(response.status()).toBe(expectedStatus);
    const body = await response.json();
    expect(body.error.code).toBe(expectedCode);
  }
}
```

## Guidelines

1. Group assertions by domain (e.g., `OrderAssertions`, `UserAssertions`).
2. Keep assertions focused — one assertion, one concern.
3. Always include the `expect` call — no silent assertions.
4. Use `async` when dealing with JSON body parsing.