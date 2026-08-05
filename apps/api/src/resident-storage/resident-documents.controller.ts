import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';
import { ResidentDocumentsService } from './resident-documents.service';

@ApiTags('resident documents')
@Controller('residents/:residentId/documents')
export class ResidentDocumentsController {
  constructor(private readonly documents: ResidentDocumentsService) {}
  @Get() list(
    @CurrentUser() user: RequestUser,
    @Param('residentId', ParseUUIDPipe) residentId: string,
  ) {
    return this.documents.list(user, residentId);
  }
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { files: 1, fileSize: 20_000_000 } }),
  )
  upload(
    @CurrentUser() user: RequestUser,
    @Param('residentId', ParseUUIDPipe) residentId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('category') category: string,
    @Body('replaceId') replaceId?: string,
  ) {
    return this.documents.upload(user, residentId, category, file, replaceId);
  }
  @Get(':documentId')
  async download(
    @CurrentUser() user: RequestUser,
    @Param('residentId', ParseUUIDPipe) residentId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Res() response: Response,
  ) {
    const file = await this.documents.download(user, residentId, documentId);
    response.setHeader('Content-Type', file.mediaType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName.replace(/["\r\n]/g, '_')}"`,
    );
    response.send(file.buffer);
  }
  @Post(':documentId/archive')
  archive(
    @CurrentUser() user: RequestUser,
    @Param('residentId', ParseUUIDPipe) residentId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body('reason') reason?: string,
  ) {
    if (!reason || reason.trim().length < 3)
      throw new BadRequestException('An archival reason is required.');
    return this.documents.archive(user, residentId, documentId, reason.trim());
  }
}
