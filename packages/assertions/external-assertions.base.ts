import { expect } from '@playwright/test';

/**
 * Base external system assertions — verification helpers for external system data.
 *
 * Used to compare data between the application and external systems
 * (e.g., candidate data in ATS vs in Greenhouse).
 *
 * TODO: Extend with business-specific external assertions in project spaces.
 */
export class ExternalAssertionsBase {
  static expectEqual<T>(appValue: T, externalValue: T, label: string): void {
    expect(
      externalValue,
      `External system mismatch for "${label}": app has "${appValue}", external has "${externalValue}"`
    ).toBe(appValue);
  }

  static expectMatch(
    appValue: string,
    externalValue: string,
    pattern: RegExp,
    label: string
  ): void {
    const appMatch = pattern.test(appValue);
    const externalMatch = pattern.test(externalValue);
    expect(
      appMatch && externalMatch,
      `Pattern mismatch for "${label}": app="${appValue}" matches=${appMatch}, external="${externalValue}" matches=${externalMatch}`
    ).toBe(true);
  }

  static expectExists<T>(value: T | null | undefined, label: string): void {
    expect(
      value,
      `Expected "${label}" to exist in external system but it was ${value === null ? 'null' : 'undefined'}`
    ).toBeDefined();
    expect(value).not.toBeNull();
  }

  static expectDateWithin(
    appDate: Date,
    externalDate: Date,
    toleranceMs: number,
    label: string
  ): void {
    const diff = Math.abs(appDate.getTime() - externalDate.getTime());
    expect(
      diff,
      `Date mismatch for "${label}": app=${appDate.toISOString()}, external=${externalDate.toISOString()}, diff=${diff}ms (tolerance=${toleranceMs}ms)`
    ).toBeLessThanOrEqual(toleranceMs);
  }
}