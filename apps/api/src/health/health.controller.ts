import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../authorization/authorization.decorators';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get('live')
  live() {
    return {
      status: 'ok',
      service: 'residence-api',
      version: this.config.getOrThrow<string>('app.version'),
    };
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        checks: { database: 'ready', privateStorage: 'ready' },
      };
    } catch {
      throw new ServiceUnavailableException('Database readiness check failed.');
    }
  }

  @Get('configuration')
  configuration() {
    return {
      notifications: this.config.getOrThrow<string>(
        'notification.providerMode',
      ),
      payments: this.config.getOrThrow<string>('payment.providerMode'),
      privateStorage: 'configured',
    };
  }
}
