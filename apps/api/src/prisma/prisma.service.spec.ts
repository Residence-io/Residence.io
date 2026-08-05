import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('creates a PostgreSQL-backed client with lifecycle hooks', () => {
    const service = new PrismaService({
      getOrThrow: () => 'postgresql://user:pass@localhost:5432/residence',
    } as unknown as ConfigService);
    expect(typeof service.onModuleInit).toBe('function');
    expect(typeof service.onModuleDestroy).toBe('function');
  });
});
