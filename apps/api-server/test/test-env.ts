// Loaded via jest-e2e.json's `setupFiles`, which Jest runs before any test file
// (and therefore before `import { AppModule }`) is evaluated. AppModule's
// ConfigModule.forRoot() validates process.env as soon as the module is defined -
// setting these inside a `beforeAll` would be too late, since ES module imports are
// hoisted above all other statements in the importing file.
export const TEST_JWT_SECRET = 'e2e-test-access-secret-000000';
export const TEST_JWT_REFRESH_SECRET = 'e2e-test-refresh-secret-000000';

process.env.NODE_ENV = 'test';
process.env.API_PORT = '3999';
process.env.CORS_ORIGIN = 'http://localhost:4200';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test?schema=clinic';
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = TEST_JWT_REFRESH_SECRET;
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
