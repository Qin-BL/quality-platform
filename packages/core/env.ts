import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  TEST_ENV: string;
  PROJECT_KEY?: string;
  REQUEST_ID?: string;
  APP_BASE_URL?: string;
  API_BASE_URL?: string;
  PLAYWRIGHT_BASE_URL?: string;
  EXTERNAL_SYSTEM_BASE_URL?: string;
  EXTERNAL_SYSTEM_API_TOKEN?: string;
  DESIGN_API_TOKEN?: string;
  DESIGN_FILE_KEY?: string;
  CALENDAR_API_TOKEN?: string;
  EMAIL_TEST_API_TOKEN?: string;
  AUTH_BOOTSTRAP_MODE?: string;
  AUTH_STATE_PATH?: string;
  AUTH_LOGIN_URL?: string;
  AUTH_SUCCESS_URL_PATTERN?: string;
  AUTHENTICATED_CHECK_URL?: string;
  TEST_USER_EMAIL?: string;
  TEST_USER_PASSWORD?: string;
  ALLOW_PRODUCTION_READONLY: boolean;
  ALLOW_PRODUCTION_WRITE: boolean;
  HEADLESS: boolean;
  PLAYWRIGHT_HEADLESS: boolean;
  AI_PLANNER_ENABLED: boolean;
  AI_GENERATOR_ENABLED: boolean;
  AI_EXPLORER_ENABLED: boolean;
  AI_HEALER_ENABLED: boolean;
  CI: boolean;
  WEB_SERVER_DISABLED: boolean;
  WEB_SERVER_COMMAND?: string;
  WEB_SERVER_URL?: string;
}

export class Env {
  private static config: EnvConfig;

  static normalizeEnvironment(value?: string): string {
    if (!value) return 'local';
    return value === 'production' ? 'production-smoke' : value;
  }

  static init(): void {
    if (this.config) return;

    this.config = {
      TEST_ENV: this.normalizeEnvironment(process.env.TEST_ENV),
      PROJECT_KEY: process.env.PROJECT_KEY,
      REQUEST_ID: process.env.REQUEST_ID,
      APP_BASE_URL: process.env.APP_BASE_URL,
      API_BASE_URL: process.env.API_BASE_URL,
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL,
      EXTERNAL_SYSTEM_BASE_URL: process.env.EXTERNAL_SYSTEM_BASE_URL,
      EXTERNAL_SYSTEM_API_TOKEN: process.env.EXTERNAL_SYSTEM_API_TOKEN,
      DESIGN_API_TOKEN: process.env.DESIGN_API_TOKEN,
      DESIGN_FILE_KEY: process.env.DESIGN_FILE_KEY,
      CALENDAR_API_TOKEN: process.env.CALENDAR_API_TOKEN,
      EMAIL_TEST_API_TOKEN: process.env.EMAIL_TEST_API_TOKEN,
      AUTH_BOOTSTRAP_MODE: process.env.AUTH_BOOTSTRAP_MODE,
      AUTH_STATE_PATH: process.env.AUTH_STATE_PATH,
      AUTH_LOGIN_URL: process.env.AUTH_LOGIN_URL,
      AUTH_SUCCESS_URL_PATTERN: process.env.AUTH_SUCCESS_URL_PATTERN,
      AUTHENTICATED_CHECK_URL: process.env.AUTHENTICATED_CHECK_URL,
      TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
      ALLOW_PRODUCTION_READONLY: process.env.ALLOW_PRODUCTION_READONLY === 'true',
      ALLOW_PRODUCTION_WRITE: process.env.ALLOW_PRODUCTION_WRITE === 'true',
      HEADLESS: process.env.HEADLESS !== 'false',
      PLAYWRIGHT_HEADLESS: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      AI_PLANNER_ENABLED: process.env.AI_PLANNER_ENABLED === 'true',
      AI_GENERATOR_ENABLED: process.env.AI_GENERATOR_ENABLED === 'true',
      AI_EXPLORER_ENABLED: process.env.AI_EXPLORER_ENABLED === 'true',
      AI_HEALER_ENABLED: process.env.AI_HEALER_ENABLED === 'true',
      CI: process.env.CI === 'true',
      WEB_SERVER_DISABLED: process.env.WEB_SERVER_DISABLED === 'true',
      WEB_SERVER_COMMAND: process.env.WEB_SERVER_COMMAND,
      WEB_SERVER_URL: process.env.WEB_SERVER_URL,
    };
  }

  static getConfig(): EnvConfig {
    if (!this.config) {
      this.init();
    }
    return this.config;
  }

  static requiredEnv(key: keyof EnvConfig): string {
    const value = this.getConfig()[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return String(value);
  }

  static optionalEnv(key: keyof EnvConfig): string | undefined {
    return this.getConfig()[key] as string | undefined;
  }

  static isProduction(): boolean {
    return this.getConfig().TEST_ENV === 'production-smoke';
  }

  static isProductionWriteAllowed(): boolean {
    return this.getConfig().ALLOW_PRODUCTION_WRITE;
  }

  static isProductionReadonlyAllowed(): boolean {
    return this.getConfig().ALLOW_PRODUCTION_READONLY;
  }

  static assertNotProductionWrite(): void {
    if (this.isProduction() && this.isProductionWriteAllowed()) {
      throw new Error('Production write operations are not allowed');
    }
  }
}

Env.init();
