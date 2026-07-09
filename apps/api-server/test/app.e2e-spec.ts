import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TEST_JWT_REFRESH_SECRET, TEST_JWT_SECRET } from './test-env';

// Exercises the Sprint 11 foundation end-to-end: the global JwtAuthGuard actually
// rejects unauthenticated requests, a valid access token is accepted, and a valid
// refresh token can be rotated into a new pair. PrismaService is stubbed so this
// suite doesn't require a live Postgres connection to prove the auth wiring works.
// Required env vars are set in test-env.ts (a Jest `setupFiles` entry), which runs
// before this file's `import { AppModule }` is evaluated.
describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const jwtSecret = TEST_JWT_SECRET;
  const jwtRefreshSecret = TEST_JWT_REFRESH_SECRET;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        isDatabaseHealthy: () => Promise.resolve(true),
        $connect: () => Promise.resolve(),
        $disconnect: () => Promise.resolve(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    jwtService = new JwtService();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) is public and reports the database as up', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('/auth/me (GET) rejects requests without a bearer token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('/auth/me (GET) accepts a valid access token and echoes the payload', async () => {
    const accessToken = await jwtService.signAsync(
      { sub: 'user-1', email: 'demo@kapis.ai' },
      { secret: jwtSecret, expiresIn: '15m' },
    );

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({ sub: 'user-1', email: 'demo@kapis.ai' });
  });

  it('/auth/refresh (POST) rotates a valid refresh token into a new pair', async () => {
    const refreshToken = await jwtService.signAsync(
      { sub: 'user-1', email: 'demo@kapis.ai' },
      { secret: jwtRefreshSecret, expiresIn: '7d' },
    );

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: '15m',
      }),
    );
  });
});
