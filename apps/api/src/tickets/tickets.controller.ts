import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../authorization/current-user.decorator';
import { RequirePermissions } from '../authorization/authorization.decorators';
import type { RequestUser } from '../common/request-context';
import {
  AdminAssignmentDto,
  AppointmentDto,
  ComplaintSubmissionDto,
  MaintenanceSubmissionDto,
  PriorityDto,
  RatingDto,
  ResolutionDto,
  ServiceLevelDto,
  TicketCategoryDto,
  TicketMessageDto,
  TicketQueryDto,
  TicketTransitionDto,
  WorkerAssignmentDto,
} from './dto/ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get('categories/:type') categories(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaint' | 'maintenance',
  ) {
    return this.tickets.categories(user, type);
  }
  @Post('categories/:type') category(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaint' | 'maintenance',
    @Body() dto: TicketCategoryDto,
  ) {
    return this.tickets.createCategory(user, type, dto);
  }
  @Post('complaints') complaint(
    @CurrentUser() user: RequestUser,
    @Body() dto: ComplaintSubmissionDto,
  ) {
    return this.tickets.submitComplaint(user, dto);
  }
  @Post('maintenance') maintenance(
    @CurrentUser() user: RequestUser,
    @Body() dto: MaintenanceSubmissionDto,
  ) {
    return this.tickets.submitMaintenance(user, dto);
  }
  @Get('complaints') complaints(
    @CurrentUser() user: RequestUser,
    @Query() query: TicketQueryDto,
  ) {
    return this.tickets.list(user, 'complaint', query);
  }
  @Get('maintenance') maintenanceList(
    @CurrentUser() user: RequestUser,
    @Query() query: TicketQueryDto,
  ) {
    return this.tickets.list(user, 'maintenance', query);
  }
  @Get('dashboard') dashboard(@CurrentUser() user: RequestUser) {
    return this.tickets.dashboard(user);
  }
  @Get('service-levels') levels(@CurrentUser() user: RequestUser) {
    return this.tickets.serviceLevels(user);
  }
  @Post('service-levels') level(
    @CurrentUser() user: RequestUser,
    @Body() dto: ServiceLevelDto,
  ) {
    return this.tickets.createServiceLevel(user, dto);
  }
  @Post('escalations/run') @RequirePermissions('MAINTENANCE_MANAGE') escalate(
    @CurrentUser() user: RequestUser,
  ) {
    return this.tickets.escalateDue(user);
  }
  @Get('exports/:type.csv') @RequirePermissions('TICKET_EXPORT') async export(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaints' | 'maintenance',
    @Res() response: Response,
  ) {
    const csv = await this.tickets.exportCsv(user, type);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}.csv"`,
    );
    response.send(csv);
  }
  @Get(':type/:id') detail(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaint' | 'maintenance',
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tickets.detail(user, type, id);
  }
  @Post(':type/:id/status/:status') transition(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaint' | 'maintenance',
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: string,
    @Body() dto: TicketTransitionDto,
  ) {
    return this.tickets.transition(user, type, id, status, dto);
  }
  @Post(':type/:id/priority') priority(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaint' | 'maintenance',
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PriorityDto,
  ) {
    return this.tickets.setPriority(user, type, id, dto);
  }
  @Post('complaint/:id/administrator') administrator(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminAssignmentDto,
  ) {
    return this.tickets.assignAdministrator(user, id, dto);
  }
  @Post(':type/:id/messages') message(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaint' | 'maintenance',
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TicketMessageDto,
  ) {
    return this.tickets.addMessage(user, type, id, dto);
  }
  @Get('maintenance/:id/eligible') eligible(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startsAt') startsAt: string,
    @Query('endsAt') endsAt: string,
  ) {
    return this.tickets.eligible(user, id, startsAt, endsAt);
  }
  @Post('maintenance/:id/assignments') assignment(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WorkerAssignmentDto,
  ) {
    return this.tickets.assignWorker(user, id, dto);
  }
  @Post('maintenance/:id/appointments') appointment(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AppointmentDto,
  ) {
    return this.tickets.schedule(user, id, dto);
  }
  @Post('maintenance/:id/appointments/:appointmentId/reschedule') reschedule(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() dto: AppointmentDto,
  ) {
    return this.tickets.reschedule(user, id, appointmentId, dto);
  }
  @Post('maintenance/:id/resolution') resolution(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolutionDto,
  ) {
    return this.tickets.resolve(user, id, dto);
  }
  @Post('maintenance/:id/rating') rating(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RatingDto,
  ) {
    return this.tickets.rate(user, id, dto);
  }
  @Post(':type/:id/attachments')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { files: 1, fileSize: 20_000_000 } }),
  )
  upload(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaint' | 'maintenance',
    @Param('id', ParseUUIDPipe) id: string,
    @Body('sensitive') sensitive: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tickets.upload(user, type, id, sensitive === 'true', file);
  }
  @Get(':type/:id/attachments/:attachmentId') async download(
    @CurrentUser() user: RequestUser,
    @Param('type') type: 'complaint' | 'maintenance',
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res() response: Response,
  ) {
    const file = (await this.tickets.download(
      user,
      type,
      id,
      attachmentId,
    )) as {
      mediaType: string;
      fileName: string;
      buffer: Buffer;
    };
    response.setHeader('Content-Type', file.mediaType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName.replace(/["\r\n]/g, '_')}"`,
    );
    response.send(file.buffer);
  }
}
