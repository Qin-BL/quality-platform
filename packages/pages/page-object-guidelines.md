# Page Object Model Guidelines

## Core Principles

1. **One page, one class** — Each page or significant component gets its own Page Object.
2. **Extend `BasePage`** — All page objects extend `packages/pages/base-page.ts`.
3. **Locator naming** — Use descriptive names. Prefer `data-testid` selectors.
4. **Method naming conventions**:
   - `navigate()` — Navigate to the page
   - `useXxx()` — Perform an action (click, fill, select)
   - `getXxx()` — Get a value or element
   - `isXxx()` — Check visibility or state
   - `expectXxx()` — Assertion helper
5. **No business logic** — Page objects handle DOM interaction, not business rules.
6. **Composable** — Page objects can reference other page objects for multi-page flows.

## Example Structure

```typescript
import { expect, Page } from '@playwright/test';
import { BasePage } from '../../../../../packages/pages/base-page';

export class LoginPage extends BasePage {
  readonly emailInput = this.page.locator('[data-testid="email-input"]');
  readonly passwordInput = this.page.locator('[data-testid="password-input"]');
  readonly submitButton = this.page.locator('[data-testid="login-submit"]');
  readonly errorMessage = this.page.locator('[data-testid="login-error"]');

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.goto('/login');
    await this.waitForReady();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }
}
```

## When to Create a Page Object

- The page has user interactions (forms, buttons, navigation)
- The page is used in multiple test files
- The page has a distinct visual structure

## When NOT to Create a Page Object

- The page is trivial (single element check)
- The page interaction is one-off
- The logic should live in an assertion helper instead