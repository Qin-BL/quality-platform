/**
 * Base interface for test data factories.
 *
 * All project-specific test data factories should follow this pattern.
 *
 * TODO: Extend with business-specific factory functions in project spaces.
 */

export interface TestDataFactory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
}

export function createTestDataFactory<T>(defaults: () => T): TestDataFactory<T> {
  return {
    create(overrides?: Partial<T>): T {
      return { ...defaults(), ...overrides };
    },
    createMany(count: number, overrides?: Partial<T>): T[] {
      return Array.from({ length: count }, () => ({
        ...defaults(),
        ...overrides,
      }));
    },
  };
}

/**
 * Generate a unique test identifier.
 * Use this for test data fields that must be unique (e.g., emails, usernames).
 */
export function testId(prefix: string = 'qc'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}