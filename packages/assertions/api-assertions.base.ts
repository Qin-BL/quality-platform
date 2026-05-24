import { expect, APIResponse } from '@playwright/test';

/**
 * Base API assertions — generic HTTP response verification helpers.
 *
 * TODO: Extend with business-specific API assertions in project spaces.
 */
export class ApiAssertionsBase {
  static async expectStatus(response: APIResponse, expectedStatus: number): Promise<void> {
    const body = await response.text().catch(() => '<unreadable>');
    expect(
      response.status(),
      `Expected status ${expectedStatus} but got ${response.status()}. Body: ${body.substring(0, 500)}`
    ).toBe(expectedStatus);
  }

  static async expectOk(response: APIResponse): Promise<void> {
    await ApiAssertionsBase.expectStatus(response, 200);
  }

  static async expectCreated(response: APIResponse): Promise<void> {
    await ApiAssertionsBase.expectStatus(response, 201);
  }

  static async expectNoContent(response: APIResponse): Promise<void> {
    await ApiAssertionsBase.expectStatus(response, 204);
  }

  static async expectBadRequest(response: APIResponse): Promise<void> {
    await ApiAssertionsBase.expectStatus(response, 400);
  }

  static async expectUnauthorized(response: APIResponse): Promise<void> {
    await ApiAssertionsBase.expectStatus(response, 401);
  }

  static async expectForbidden(response: APIResponse): Promise<void> {
    await ApiAssertionsBase.expectStatus(response, 403);
  }

  static async expectNotFound(response: APIResponse): Promise<void> {
    await ApiAssertionsBase.expectStatus(response, 404);
  }

  static async expectJsonContentType(response: APIResponse): Promise<void> {
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  }

  static async expectJsonBody<T extends Record<string, unknown>>(
    response: APIResponse,
    shape: Partial<T>
  ): Promise<void> {
    const body = (await response.json()) as T;
    for (const [key, value] of Object.entries(shape)) {
      expect(body[key], `Expected body.${key} to be ${JSON.stringify(value)}`).toEqual(value);
    }
  }
}