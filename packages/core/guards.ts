import { Env } from './env';

export function assertReadonlyProductionOnly(): void {
  if (!Env.isProduction()) return;

  if (Env.isProductionWriteAllowed()) {
    throw new Error(
      'PRODUCTION SAFETY VIOLATION: ALLOW_PRODUCTION_WRITE is true. ' +
      'Production write access is FORBIDDEN by default. ' +
      'Set ALLOW_PRODUCTION_WRITE=false in your .env file.'
    );
  }
}

export function assertNoProductionWrite(): void {
  if (!Env.isProduction()) return;

  if (Env.isProductionWriteAllowed()) {
    throw new Error(
      'PRODUCTION SAFETY VIOLATION: ALLOW_PRODUCTION_WRITE is true. ' +
      'Production write operations are STRICTLY FORBIDDEN. ' +
      'This guard prevents accidental production data contamination. ' +
      'If you genuinely need production write access, this must be explicitly approved ' +
      'and the env var must be set with full understanding of the risk.'
    );
  }
}

export function assertProductionReadonlyAllowed(): void {
  if (!Env.isProduction()) return;

  if (!Env.isProductionReadonlyAllowed()) {
    throw new Error(
      'PRODUCTION SAFETY: ALLOW_PRODUCTION_READONLY is false. ' +
      'Production readonly access requires explicit opt-in. ' +
      'Set ALLOW_PRODUCTION_READONLY=true only for readonly smoke tests.'
    );
  }
}

export function guardProduction(): void {
  assertProductionReadonlyAllowed();
  assertNoProductionWrite();
}

export function validateProductionSafety(): {
  environment: string;
  readonlyAllowed: boolean;
  writeAllowed: boolean;
  isSafe: boolean;
  violations: string[];
} {
  const env = Env.getConfig();
  const readonlyAllowed = env.ALLOW_PRODUCTION_READONLY;
  const writeAllowed = env.ALLOW_PRODUCTION_WRITE;
  const violations: string[] = [];

  if (Env.isProduction() && writeAllowed) {
    violations.push(
      'CRITICAL: ALLOW_PRODUCTION_WRITE is true in production environment. ' +
      'This allows data mutation on production. Set to false immediately.'
    );
  }

  return {
    environment: env.TEST_ENV,
    readonlyAllowed,
    writeAllowed,
    isSafe: violations.length === 0,
    violations,
  };
}