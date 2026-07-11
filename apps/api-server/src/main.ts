import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService<{ app: AppConfig }>);
  const { port, corsOrigins } = configService.get('app', { infer: true })!;

  app.use(helmet());
  // exposedHeaders added in Sprint 23 solely so apps/clinic-admin's
  // AnalyticsService can read the real filename off Content-Disposition for
  // a cross-origin POST /api/analytics/export response - browsers hide every
  // response header from JS by default except the CORS-safelisted ones,
  // Content-Disposition isn't one of them. No other Sprint 1-22 endpoint
  // sends a file download, so nothing else needed this until now.
  app.enableCors({ origin: corsOrigins, credentials: true, exposedHeaders: ['Content-Disposition'] });
  // apps/clinic-admin's environment.ts has always pointed apiBaseUrl at
  // `/api` (see Sprint 1); Sprint 11 just never added the matching prefix
  // since it shipped no business routes yet. `health` stays unprefixed so
  // docker-compose's `wget http://localhost:3000/health` healthcheck (Sprint 11)
  // keeps working unchanged.
  app.setGlobalPrefix('api', { exclude: ['health'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kapis Clinic AI API')
    .setDescription('Backend API for the Kapis Clinic AI platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
