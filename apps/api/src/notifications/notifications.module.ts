import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsController } from './notifications.controller';
import { NotificationProcessorService } from './notification-processor.service';
import { NotificationsService } from './notifications.service';
import {
  SandboxEmailProvider,
  SandboxSmsProvider,
} from './providers/sandbox.providers';
import { TemplateRenderer } from './template-renderer';

@Module({
  imports: [AuditModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationProcessorService,
    TemplateRenderer,
    SandboxEmailProvider,
    SandboxSmsProvider,
  ],
  exports: [NotificationsService, NotificationProcessorService],
})
export class NotificationsModule {}
