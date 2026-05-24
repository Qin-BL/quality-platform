export class QCError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QCError';
  }
}

export class EnvError extends QCError {
  constructor(variable: string) {
    super(`Environment variable "${variable}" is not set.`);
    this.name = 'EnvError';
  }
}

export class ExternalSystemError extends QCError {
  constructor(system: string, detail: string) {
    super(`External system "${system}" error: ${detail}`);
    this.name = 'ExternalSystemError';
  }
}

export class TestDataError extends QCError {
  constructor(detail: string) {
    super(`Test data error: ${detail}`);
    this.name = 'TestDataError';
  }
}

export class AssertionError extends QCError {
  constructor(detail: string) {
    super(`Assertion failed: ${detail}`);
    this.name = 'AssertionError';
  }
}

export class ProductionSafetyError extends QCError {
  constructor(detail: string) {
    super(`Production safety violation: ${detail}`);
    this.name = 'ProductionSafetyError';
  }
}