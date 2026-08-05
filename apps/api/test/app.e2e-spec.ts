import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from '../src/health/health.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('health API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string> = {
                'app.version': 'test',
                'notification.providerMode': 'disabled',
                'payment.providerMode': 'disabled',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('reports liveness', () =>
    request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect({ status: 'ok', service: 'residence-api', version: 'test' }));
  it('reports database readiness', () =>
    request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect({
        status: 'ready',
        checks: { database: 'ready', privateStorage: 'ready' },
      }));

  it('reports only safe provider configuration', () =>
    request(app.getHttpServer())
      .get('/api/v1/health/configuration')
      .expect(200)
      .expect({
        notifications: 'disabled',
        payments: 'disabled',
        privateStorage: 'configured',
      }));

  afterAll(() => app.close());
});
