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
  app.enableCors({ origin: corsOrigins, credentials: true });

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
