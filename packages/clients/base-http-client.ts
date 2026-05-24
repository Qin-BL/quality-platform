import { Logger } from '../core/logger';
import { Env, ProductionSafetyError } from '../core';

export interface HttpClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  isReadonly?: boolean;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export class BaseHttpClient {
  protected config: HttpClientConfig;
  protected logger: Logger;

  constructor(config: HttpClientConfig, loggerName = 'HttpClient') {
    this.config = {
      timeout: 30_000,
      ...config,
    };
    this.logger = new Logger(loggerName);
  }

  protected async request<T>(options: RequestOptions): Promise<HttpResponse<T>> {
    const { method, path, body, headers, isReadonly = method === 'GET' } = options;

    if (!isReadonly && Env.isProduction() && !Env.isProductionWriteAllowed()) {
      throw new ProductionSafetyError('Write operations in production are not allowed');
    }

    const url = `${this.config.baseUrl}${path}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...headers,
    };

    this.logger.debug(`Making ${method} request to ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: T;
      try {
        data = await response.json() as T;
      } catch {
        data = {} as T;
      }

      if (!response.ok) {
        this.logger.error(`Request failed with status ${response.status}`, { url, data });
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
      }

      this.logger.debug(`Request successful: ${method} ${url}`);
      return { status: response.status, data, headers: responseHeaders };
    } catch (error) {
      clearTimeout(timeoutId);
      this.logger.error(`Request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  async get<T>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', path, headers, isReadonly: true });
  }

  async post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', path, body, headers });
  }

  async put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body, headers });
  }

  async patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', path, body, headers });
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', path, headers });
  }
}
