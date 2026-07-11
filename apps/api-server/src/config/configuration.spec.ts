import configuration from './configuration';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('splits a comma-separated CORS_ORIGIN into a trimmed array', () => {
    process.env.CORS_ORIGIN = 'http://localhost:4200, http://localhost:4300 ,,';

    const { app } = configuration();

    expect(app.corsOrigins).toEqual(['http://localhost:4200', 'http://localhost:4300']);
  });

  it('falls back to sensible defaults when optional vars are unset', () => {
    delete process.env.API_PORT;
    delete process.env.CORS_ORIGIN;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;

    const { app } = configuration();

    expect(app.port).toBe(3000);
    expect(app.corsOrigins).toEqual([]);
    expect(app.jwt.expiresIn).toBe('15m');
    expect(app.jwt.refreshExpiresIn).toBe('7d');
  });

  it('defaults the Claude provider config when ANTHROPIC_* vars are unset', () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_MODEL;
    delete process.env.ANTHROPIC_API_URL;
    delete process.env.ANTHROPIC_MAX_TOKENS;
    delete process.env.ANTHROPIC_TEMPERATURE;
    delete process.env.ANTHROPIC_HTTP_TIMEOUT_MS;

    const { app } = configuration();

    expect(app.anthropic.apiKey).toBe('');
    expect(app.anthropic.model).toBe('claude-sonnet-5');
    expect(app.anthropic.apiUrl).toBe('https://api.anthropic.com');
    expect(app.anthropic.maxTokens).toBe(1024);
    expect(app.anthropic.temperature).toBe(0.7);
    expect(app.anthropic.httpTimeoutMs).toBe(30000);
  });
});
