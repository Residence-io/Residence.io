import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ResidentDocumentsService } from './resident-documents.service';
import { ResidentRequestsService } from './resident-requests.service';
import { MoveInOutService } from './move-in-out.service';
import { CommunityService } from './community.service';
import {
  CreateResidentRequestDto,
  CreateMoveInRequestDto,
  CreateMoveOutRequestDto,
  UploadResidentDocumentDto,
} from './dto/self-service.dto';

@Controller()
@RequirePermissions(PERMISSIONS.RESIDENT_READ)
export class ResidentSelfServiceController {
  constructor(
    private readonly documentsService: ResidentDocumentsService,
    private readonly requestsService: ResidentRequestsService,
    private readonly moveInOutService: MoveInOutService,
    private readonly communityService: CommunityService,
    private readonly prisma: PrismaService,
  ) {}

  private async getResident(societyId: string, userId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId, userId, status: 'ACTIVE' },
    });
    if (!resident) {
      throw new NotFoundException('Active resident profile not found.');
    }
    return resident;
  }

  // ==================== DOCUMENTS ====================

  @Get('resident-documents/me')
  async getMyDocuments(@CurrentUser() user: AuthenticatedUser) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.documentsService.getResidentDocuments(
      user.societyId,
      resident.id,
    );
  }

  @Post('resident-documents/me')
  @UseInterceptors(
    FileInterceptor('file', { limits: { files: 1, fileSize: 15_000_000 } }),
  )
  async uploadMyDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadResidentDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    if (!file) {
      throw new NotFoundException('File is required for document upload.');
    }
    return this.documentsService.uploadResidentDocument(
      user.societyId,
      resident.id,
      user.id,
      dto.category,
      file.buffer,
      file.originalname,
      file.mimetype,
      dto.documentNumber,
      dto.issuedAt,
      dto.expiresAt,
    );
  }

  // ==================== REQUESTS & CERTIFICATES ====================

  @Get('resident-requests/me')
  async getMyRequests(@CurrentUser() user: AuthenticatedUser) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.requestsService.getResidentRequests(
      user.societyId,
      resident.id,
    );
  }

  @Get('resident-requests/me/:id')
  async getMyRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.requestsService.getResidentRequestById(
      user.societyId,
      resident.id,
      id,
    );
  }

  @Post('resident-requests')
  async createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateResidentRequestDto,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.requestsService.createRequest(
      user.societyId,
      resident.id,
      user.id,
      dto,
    );
  }

  @Patch('resident-requests/me/:id/cancel')
  async cancelRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.requestsService.cancelRequest(
      user.societyId,
      resident.id,
      user.id,
      id,
    );
  }

  // ==================== MOVE-IN ====================

  @Get('move-in-requests/me')
  async getMyMoveInRequests(@CurrentUser() user: AuthenticatedUser) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.moveInOutService.getResidentMoveInRequests(
      user.societyId,
      resident.id,
    );
  }

  @Post('move-in-requests')
  async createMoveInRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMoveInRequestDto,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.moveInOutService.createMoveInRequest(
      user.societyId,
      resident.id,
      user.id,
      dto,
    );
  }

  // ==================== MOVE-OUT ====================

  @Get('move-out-requests/me')
  async getMyMoveOutRequests(@CurrentUser() user: AuthenticatedUser) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.moveInOutService.getResidentMoveOutRequests(
      user.societyId,
      resident.id,
    );
  }

  @Post('move-out-requests')
  async createMoveOutRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMoveOutRequestDto,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.moveInOutService.createMoveOutRequest(
      user.societyId,
      resident.id,
      user.id,
      dto,
    );
  }

  // ==================== COMMUNITY & EMERGENCY ====================

  @Get('community/events')
  async getCommunityEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.communityService.getEvents(user.societyId);
  }

  @Get('community/emergency-contacts')
  async getEmergencyContacts(@CurrentUser() user: AuthenticatedUser) {
    return this.communityService.getEmergencyContacts(user.societyId, true);
  }
}
