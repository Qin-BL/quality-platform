import { BaseHttpClient, type HttpClientConfig, type HttpResponse } from './base-http-client';
import { Env } from '../core';

export interface DesignClientConfig extends Partial<HttpClientConfig> {
  apiToken?: string;
  fileKey?: string;
}

export class DesignClientBase extends BaseHttpClient {
  protected fileKey?: string;

  constructor(config?: DesignClientConfig) {
    const apiToken = config?.apiToken ?? Env.optionalEnv('DESIGN_API_TOKEN');
    const fileKey = config?.fileKey ?? Env.optionalEnv('DESIGN_FILE_KEY');

    const headers: Record<string, string> = {
      ...config?.headers,
    };

    if (apiToken) {
      headers['X-Design-Token'] = apiToken;
    }

    super({
      ...config,
      baseUrl: config?.baseUrl ?? 'https://api.figma.com/v1',
      headers,
    }, 'DesignClient');

    this.fileKey = fileKey;
  }

  // TODO: Add design system API methods here
  // Examples: getFile, getNodes, getStyles, etc.

  async getFile(fileKey?: string): Promise<HttpResponse<unknown>> {
    const key = fileKey ?? this.fileKey;
    if (!key) {
      throw new Error('Design file key is required');
    }
    return this.get(`/files/${key}`);
  }
}
