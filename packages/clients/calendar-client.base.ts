import { BaseHttpClient, type HttpClientConfig, type HttpResponse } from './base-http-client';
import { Env } from '../core';

export interface CalendarClientConfig extends Partial<HttpClientConfig> {
  apiToken?: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
}

export class CalendarClientBase extends BaseHttpClient {
  constructor(config?: CalendarClientConfig) {
    const apiToken = config?.apiToken ?? Env.optionalEnv('CALENDAR_API_TOKEN');

    const headers: Record<string, string> = {
      ...config?.headers,
    };

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    super({
      ...config,
      baseUrl: config?.baseUrl ?? 'https://www.googleapis.com/calendar/v3',
      headers,
    }, 'CalendarClient');
  }

  // TODO: Add calendar API methods here
  // Examples: getEvents, createEvent, updateEvent, deleteEvent, etc.

  async getEvents(calendarId = 'primary'): Promise<HttpResponse<unknown>> {
    return this.get(`/calendars/${calendarId}/events`);
  }

  async createEvent(event: CalendarEvent, calendarId = 'primary'): Promise<HttpResponse<unknown>> {
    return this.post(`/calendars/${calendarId}/events`, event);
  }
}
