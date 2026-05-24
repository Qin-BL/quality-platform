import { BaseHttpClient, type HttpClientConfig, type HttpResponse } from './base-http-client';
import { Env } from '../core';

export interface EmailClientConfig extends Partial<HttpClientConfig> {
  apiToken?: string;
}

export interface EmailMessage {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export class EmailClientBase extends BaseHttpClient {
  constructor(config?: EmailClientConfig) {
    const apiToken = config?.apiToken ?? Env.optionalEnv('EMAIL_TEST_API_TOKEN');

    const headers: Record<string, string> = {
      ...config?.headers,
    };

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    super({
      ...config,
      baseUrl: config?.baseUrl ?? 'https://api.mailtrap.io',
      headers,
    }, 'EmailClient');
  }

  // TODO: Add email API methods here
  // Examples: sendEmail, getMessages, getInbox, etc.

  async sendEmail(message: EmailMessage): Promise<HttpResponse<unknown>> {
    return this.post('/send', message);
  }

  async getInbox(inboxId: string): Promise<HttpResponse<unknown>> {
    return this.get(`/inboxes/${inboxId}/messages`);
  }
}
