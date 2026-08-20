import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { CsrfGuard } from './authorization/csrf.guard';
import { PermissionsGuard } from './authorization/permissions.guard';
import { RolesGuard } from './authorization/roles.guard';
import { SessionAuthGuard } from './authorization/session-auth.guard';
import { CorrelationIdMiddleware } from './common/correlation-id.middleware';
import { ConfigurationModule } from './configuration/configuration.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { SocietiesModule } from './societies/societies.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { ResidentIDCardsModule } from './resident-id-cards/resident-id-cards.module';
import { ResidentStorageModule } from './resident-storage/resident-storage.module';
import { ResidentsModule } from './residents/residents.module';
import { FinanceModule } from './finance/finance.module';
import { WorkforceModule } from './workforce/workforce.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdministrationModule } from './administration/administration.module';
import { SupabaseModule } from './supabase/supabase.module';
import { VisitorsModule } from './visitors/visitors.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    ConfigurationModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.getOrThrow<number>('app.rateLimitTtlMs'),
            limit: config.getOrThrow<number>('app.rateLimitMax'),
          },
        ],
      }),
    }),
    PrismaModule,
    AuditModule,
    SupabaseModule,
    AuthorizationModule,
    AuthModule,
    UsersModule,
    SocietiesModule,
    SettingsModule,
    HealthModule,
    ResidentsModule,
    PropertiesModule,
    ResidentStorageModule,
    ResidentIDCardsModule,
    FinanceModule,
    WorkforceModule,
    TicketsModule,
    NotificationsModule,
    AdministrationModule,
    VisitorsModule,
    DeliveriesModule,
    VehiclesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
