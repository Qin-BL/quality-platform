import { BaseHttpClient, type HttpClientConfig, type HttpResponse } from './base-http-client';
import { Env } from '../core';

export interface AppApiClientConfig extends Partial<HttpClientConfig> {
  baseUrl?: string;
}

export class AppApiClientBase extends BaseHttpClient {
  constructor(config?: AppApiClientConfig) {
    const baseUrl = config?.baseUrl ?? Env.optionalEnv('API_BASE_URL') ?? 'http://localhost:3000/api';
    super({ ...config, baseUrl }, 'AppApiClient');
  }

  // TODO: Add specific API methods here based on business requirements
  // This is just a base class - concrete implementations should be created per project

  async healthCheck(): Promise<HttpResponse<{ status: string }>> {
    return this.get('/health');
  }
}
