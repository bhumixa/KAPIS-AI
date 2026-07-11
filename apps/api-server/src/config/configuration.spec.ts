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

  it('defaults the Gemini provider config when GEMINI_* vars are unset', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_API_URL;
    delete process.env.GEMINI_MAX_OUTPUT_TOKENS;
    delete process.env.GEMINI_TEMPERATURE;
    delete process.env.GEMINI_HTTP_TIMEOUT_MS;

    const { app } = configuration();

    expect(app.gemini.apiKey).toBe('');
    expect(app.gemini.model).toBe('gemini-2.5-flash');
    expect(app.gemini.apiUrl).toBe('https://generativelanguage.googleapis.com');
    expect(app.gemini.maxOutputTokens).toBe(1024);
    expect(app.gemini.temperature).toBe(0.7);
    expect(app.gemini.httpTimeoutMs).toBe(30000);
  });

  it('defaults the workflow runtime config when WORKFLOW_RUNTIME_* vars are unset', () => {
    delete process.env.WORKFLOW_RUNTIME_N8N_WORKFLOW_ID;
    delete process.env.WORKFLOW_RUNTIME_MAX_RETRY_ATTEMPTS;
    delete process.env.WORKFLOW_RUNTIME_RETRY_DELAY_MS;

    const { app } = configuration();

    expect(app.workflowRuntime.n8nWorkflowId).toBe('conversation-routing');
    expect(app.workflowRuntime.maxRetryAttempts).toBe(3);
    expect(app.workflowRuntime.retryDelayMs).toBe(1000);
  });

  it('defaults the Google Calendar config when GOOGLE_* vars are unset', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.GOOGLE_CALENDAR_AUTH_URL;
    delete process.env.GOOGLE_CALENDAR_TOKEN_URL;
    delete process.env.GOOGLE_CALENDAR_API_URL;
    delete process.env.GOOGLE_CALENDAR_HTTP_TIMEOUT_MS;

    const { app } = configuration();

    expect(app.googleCalendar.clientId).toBe('');
    expect(app.googleCalendar.clientSecret).toBe('');
    expect(app.googleCalendar.redirectUri).toBe('');
    expect(app.googleCalendar.authUrl).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(app.googleCalendar.tokenUrl).toBe('https://oauth2.googleapis.com/token');
    expect(app.googleCalendar.apiUrl).toBe('https://www.googleapis.com/calendar/v3');
    expect(app.googleCalendar.httpTimeoutMs).toBe(15000);
  });
});
