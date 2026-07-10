export interface AppConfig {
  env: string;
  port: number;
  corsOrigins: string[];
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  n8n: {
    baseUrl: string;
    apiKey: string;
  };
}

export default (): { app: AppConfig } => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.API_PORT ?? 3000),
    corsOrigins: (process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? '',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    n8n: {
      // Falls back to the n8n container's own vars (docker-compose.yml) so local
      // dev works with zero extra config - N8N_BRIDGE_BASE_URL only needs setting
      // to point the bridge at a different n8n instance.
      baseUrl:
        process.env.N8N_BRIDGE_BASE_URL ??
        `${process.env.N8N_PROTOCOL ?? 'http'}://${process.env.N8N_HOST ?? 'localhost'}:${process.env.N8N_PORT ?? '5678'}`,
      apiKey: process.env.N8N_API_KEY ?? '',
    },
  },
});
