import { BaseHttpClient, type HttpClientConfig, type HttpResponse } from './base-http-client';
import { Env } from '../core';

export interface ExternalSystemClientConfig extends Partial<HttpClientConfig> {
  baseUrl?: string;
  apiToken?: string;
}

/**
 * Base class for external system clients (e.g., Greenhouse, Lever, custom ATS).
 *
 * All external system access must go through this class or its extensions.
 * It enforces production safety guards by default.
 *
 * TODO: Extend for specific external systems. Add system-specific methods
 *       based on external-systems-context.md when creating a project space.
 */
export class ExternalSystemClientBase extends BaseHttpClient {
  constructor(config?: ExternalSystemClientConfig) {
    Env.assertNotProductionWrite();

    const baseUrl = config?.baseUrl ?? Env.optionalEnv('EXTERNAL_SYSTEM_BASE_URL');
    const apiToken = config?.apiToken ?? Env.optionalEnv('EXTERNAL_SYSTEM_API_TOKEN');

    if (!baseUrl) {
      throw new Error('EXTERNAL_SYSTEM_BASE_URL is required');
    }

    const headers: Record<string, string> = {
      ...config?.headers,
    };

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    super({ ...config, baseUrl, headers }, 'ExternalSystemClient');
  }

  // TODO: Add specific external system methods here
  // This is just a base class - concrete implementations should be created per project/system

  async healthCheck(): Promise<HttpResponse<{ status: string }>> {
    return this.get('/health');
  }
}
