import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AiOrchestratorModule } from './ai/ai.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { WorkflowEventsModule } from './common/events/workflow-events.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { ConversationsModule } from './conversations/conversations.module';
import { DoctorsModule } from './doctors/doctors.module';
import { HealthModule } from './health/health.module';
import { N8nModule } from './n8n/n8n.module';
import { PatientsModule } from './patients/patients.module';
import { PrismaModule } from './prisma/prisma.module';
import { RagModule } from './rag/rag.module';
import { ScheduleModule } from './schedule/schedule.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WorkflowRuntimeModule } from './workflow-runtime/workflow-runtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    PrismaModule,
    WorkflowEventsModule,
    AuthModule,
    HealthModule,
    DoctorsModule,
    PatientsModule,
    ScheduleModule,
    AppointmentsModule,
    ConversationsModule,
    N8nModule,
    RagModule,
    AiOrchestratorModule,
    WhatsappModule,
    // Composes ConversationsModule/AiOrchestratorModule/N8nModule/WhatsappModule
    // above into the automatic end-to-end pipeline (Sprint 21) - imported last
    // since it depends on all of them, same "leaf modules first, composed
    // modules last" ordering WhatsappModule already established.
    WorkflowRuntimeModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
