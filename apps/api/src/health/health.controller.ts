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

  @Get('audit-database')
  async auditDatabase() {
    const report: any = {
      timestamp: new Date().toISOString(),
      databaseUrlConfigured: !!this.config.get<string>('database.url'),
      connection: 'pending',
      tables: 'pending',
      users: 'pending',
      supabaseAuth: {
        enabled: this.config.get<boolean>('supabase.authEnabled', false),
        urlConfigured: !!this.config.get<string>('supabase.url'),
        serviceRoleKeyConfigured: !!this.config.get<string>(
          'supabase.serviceRoleKey',
        ),
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      report.connection =
        'SUCCESS (Database is reachable and credentials are valid)';
    } catch (err: any) {
      report.connection = `FAILED: ${err.message}`;
      return report;
    }

    try {
      const tables = await this.prisma.$queryRaw<any[]>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      report.tables = {
        count: tables.length,
        names: tables.map((t) => t.table_name),
        status:
          tables.length > 0 ? 'MIGRATED' : 'EMPTY (Migrations did not run!)',
      };
    } catch (err: any) {
      report.tables = `FAILED: ${err.message}`;
    }

    try {
      const userCount = await this.prisma.userAccount.count();
      report.users = {
        count: userCount,
        status:
          userCount > 0
            ? 'SEEDED'
            : 'EMPTY (No users exist, you cannot login until seeded!)',
      };
    } catch (err: any) {
      report.users = `FAILED: ${err.message} (Usually means table does not exist)`;
    }

    return report;
  }
}
