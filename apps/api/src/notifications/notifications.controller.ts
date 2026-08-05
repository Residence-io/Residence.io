import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../authorization/current-user.decorator';
import {
  Public,
  RequirePermissions,
} from '../authorization/authorization.decorators';
import type { RequestUser } from '../common/request-context';
import {
  AnnouncementDto,
  AnnouncementQueryDto,
  CallbackDto,
  ComposeDto,
  DeliveryQueryDto,
  PageDto,
  PreferenceDto,
  ReminderPreviewDto,
  TemplateDto,
  TemplatePreviewDto,
} from './dto/notification.dto';
import { NotificationProcessorService } from './notification-processor.service';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly processor: NotificationProcessorService,
  ) {}
  @Get('inbox') inbox(
    @CurrentUser() user: RequestUser,
    @Query() query: PageDto,
  ) {
    return this.notifications.inbox(user, query);
  }
  @Patch('inbox/read-all') readAll(@CurrentUser() user: RequestUser) {
    return this.notifications.readAll(user);
  }
  @Patch('inbox/:id/read') read(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.read(user, id);
  }
  @Patch('inbox/:id/archive') archive(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.archive(user, id);
  }
  @Get('preferences') preferences(@CurrentUser() user: RequestUser) {
    return this.notifications.preferences(user);
  }
  @Patch('preferences') updatePreferences(
    @CurrentUser() user: RequestUser,
    @Body() dto: PreferenceDto,
  ) {
    return this.notifications.updatePreferences(user, dto);
  }
  @Get('dashboard') dashboard(@CurrentUser() user: RequestUser) {
    return this.notifications.dashboard(user);
  }
  @Get('templates')
  @RequirePermissions('NOTIFICATION_TEMPLATE_MANAGE')
  templates(@CurrentUser() user: RequestUser, @Query() query: PageDto) {
    return this.notifications.templates(user, query);
  }
  @Post('templates/publish')
  @RequirePermissions('NOTIFICATION_TEMPLATE_MANAGE')
  template(@CurrentUser() user: RequestUser, @Body() dto: TemplateDto) {
    return this.notifications.publishTemplate(user, dto);
  }
  @Get('templates/:id')
  @RequirePermissions('NOTIFICATION_TEMPLATE_MANAGE')
  templateDetail(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.template(user, id);
  }
  @Post('templates/preview')
  @RequirePermissions('NOTIFICATION_TEMPLATE_MANAGE')
  preview(@Body() dto: TemplatePreviewDto) {
    return this.notifications.preview(dto);
  }
  @Post('compose') @RequirePermissions('NOTIFICATION_SEND') compose(
    @CurrentUser() user: RequestUser,
    @Body() dto: ComposeDto,
  ) {
    return this.notifications.compose(user, dto);
  }
  @Get('batches/:id')
  @RequirePermissions('NOTIFICATION_LOG_READ')
  batch(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.batch(user, id);
  }
  @Post('reminders/preview') @RequirePermissions('NOTIFICATION_SEND') reminder(
    @CurrentUser() user: RequestUser,
    @Body() dto: ReminderPreviewDto,
  ) {
    return this.notifications.reminderPreview(user, dto);
  }
  @Get('announcements')
  @RequirePermissions('ANNOUNCEMENT_MANAGE')
  announcements(
    @CurrentUser() user: RequestUser,
    @Query() query: AnnouncementQueryDto,
  ) {
    return this.notifications.announcements(user, query);
  }
  @Post('announcements')
  @RequirePermissions('ANNOUNCEMENT_MANAGE')
  announcement(@CurrentUser() user: RequestUser, @Body() dto: AnnouncementDto) {
    return this.notifications.createAnnouncement(user, dto);
  }
  @Get('announcements/:id')
  @RequirePermissions('ANNOUNCEMENT_MANAGE')
  announcementDetail(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.announcement(user, id);
  }
  @Get('delivery-logs') @RequirePermissions('NOTIFICATION_LOG_READ') logs(
    @CurrentUser() user: RequestUser,
    @Query() query: DeliveryQueryDto,
  ) {
    return this.notifications.deliveryLogs(user, query);
  }
  @Post('delivery-logs/:id/retry')
  @RequirePermissions('NOTIFICATION_SEND')
  retry(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.retry(user, id);
  }
  @Post('process')
  @RequirePermissions('NOTIFICATION_PROVIDER_MANAGE')
  process() {
    return this.processor.tick();
  }
  @Public() @Post('callbacks/:provider') callback(
    @Param('provider') provider: string,
    @Headers('x-notification-signature') signature: string | undefined,
    @Body() dto: CallbackDto,
  ) {
    return this.notifications.callback(
      provider,
      JSON.stringify(dto),
      signature,
      dto,
    );
  }
}
