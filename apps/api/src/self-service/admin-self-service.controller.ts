import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { ResidentDocumentsService } from './resident-documents.service';
import { ResidentRequestsService } from './resident-requests.service';
import { MoveInOutService } from './move-in-out.service';
import { CommunityService } from './community.service';
import {
  ReviewResidentDocumentDto,
  ReviewResidentRequestDto,
  IssueResidentRequestDto,
  ReviewMoveInRequestDto,
  ReviewMoveOutRequestDto,
  UpdateMoveOutClearanceDto,
  CreateCommunityEventDto,
  UpdateCommunityEventDto,
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
} from './dto/self-service.dto';
import {
  ResidentRequestStatus,
  ResidentRequestType,
  MoveInRequestStatus,
  MoveOutRequestStatus,
} from '../generated/prisma/client';

@Controller('admin')
export class AdminSelfServiceController {
  constructor(
    private readonly documentsService: ResidentDocumentsService,
    private readonly requestsService: ResidentRequestsService,
    private readonly moveInOutService: MoveInOutService,
    private readonly communityService: CommunityService,
  ) {}

  // ==================== DOCUMENTS ====================

  @Get('residents/:id/documents')
  @RequirePermissions(PERMISSIONS.RESIDENT_READ)
  async getResidentDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') residentId: string,
  ) {
    return this.documentsService.getResidentDocuments(
      user.societyId,
      residentId,
    );
  }

  @Patch('residents/documents/:docId/review')
  @RequirePermissions(PERMISSIONS.RESIDENT_UPDATE)
  async reviewDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('docId') docId: string,
    @Body() dto: ReviewResidentDocumentDto,
  ) {
    return this.documentsService.reviewDocument(
      user.societyId,
      docId,
      user.id,
      dto.status,
      dto.rejectionReason,
    );
  }

  // ==================== REQUESTS & CERTIFICATES ====================

  @Get('resident-requests')
  @RequirePermissions(PERMISSIONS.RESIDENT_REQUEST_VIEW)
  async getRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: ResidentRequestStatus,
    @Query('requestType') requestType?: ResidentRequestType,
  ) {
    return this.requestsService.getAdminRequests(user.societyId, {
      status,
      requestType,
    });
  }

  @Get('resident-requests/:id')
  @RequirePermissions(PERMISSIONS.RESIDENT_REQUEST_VIEW)
  async getRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requestsService.getAdminRequestById(user.societyId, id);
  }

  @Patch('resident-requests/:id/review')
  @RequirePermissions(PERMISSIONS.RESIDENT_REQUEST_REVIEW)
  async reviewRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewResidentRequestDto,
  ) {
    return this.requestsService.reviewRequest(user.societyId, id, user.id, dto);
  }

  @Patch('resident-requests/:id/issue')
  @RequirePermissions(PERMISSIONS.RESIDENT_REQUEST_ISSUE)
  async issueRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: IssueResidentRequestDto,
  ) {
    return this.requestsService.issueRequest(user.societyId, id, user.id, dto);
  }

  // ==================== MOVE-IN ====================

  @Get('move-in-requests')
  @RequirePermissions(PERMISSIONS.MOVE_IN_VIEW)
  async getMoveInRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: MoveInRequestStatus,
  ) {
    return this.moveInOutService.getAdminMoveInRequests(user.societyId, status);
  }

  @Patch('move-in-requests/:id/review')
  @RequirePermissions(PERMISSIONS.MOVE_IN_MANAGE)
  async reviewMoveIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewMoveInRequestDto,
  ) {
    return this.moveInOutService.reviewMoveIn(user.societyId, id, user.id, dto);
  }

  @Patch('move-in-requests/:id/complete')
  @RequirePermissions(PERMISSIONS.MOVE_IN_APPROVE)
  async completeMoveIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.moveInOutService.completeMoveIn(user.societyId, id, user.id);
  }

  // ==================== MOVE-OUT ====================

  @Get('move-out-requests')
  @RequirePermissions(PERMISSIONS.MOVE_OUT_VIEW)
  async getMoveOutRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: MoveOutRequestStatus,
  ) {
    return this.moveInOutService.getAdminMoveOutRequests(
      user.societyId,
      status,
    );
  }

  @Patch('move-out-requests/:id/clearance')
  @RequirePermissions(PERMISSIONS.MOVE_OUT_MANAGE)
  async updateClearance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMoveOutClearanceDto,
  ) {
    return this.moveInOutService.updateMoveOutClearance(
      user.societyId,
      id,
      user.id,
      dto,
    );
  }

  @Patch('move-out-requests/:id/review')
  @RequirePermissions(PERMISSIONS.MOVE_OUT_MANAGE)
  async reviewMoveOut(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewMoveOutRequestDto,
  ) {
    return this.moveInOutService.reviewMoveOut(
      user.societyId,
      id,
      user.id,
      dto,
    );
  }

  @Patch('move-out-requests/:id/complete')
  @RequirePermissions(PERMISSIONS.MOVE_OUT_APPROVE)
  async completeMoveOut(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.moveInOutService.completeMoveOut(user.societyId, id, user.id);
  }

  // ==================== COMMUNITY EVENTS ====================

  @Get('community/events')
  @RequirePermissions(PERMISSIONS.COMMUNITY_EVENT_VIEW)
  async getCommunityEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.communityService.getAllEventsAdmin(user.societyId);
  }

  @Post('community/events')
  @RequirePermissions(PERMISSIONS.COMMUNITY_EVENT_MANAGE)
  async createCommunityEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommunityEventDto,
  ) {
    return this.communityService.createEvent(user.societyId, user.id, dto);
  }

  @Patch('community/events/:id')
  @RequirePermissions(PERMISSIONS.COMMUNITY_EVENT_MANAGE)
  async updateCommunityEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCommunityEventDto,
  ) {
    return this.communityService.updateEvent(user.societyId, user.id, id, dto);
  }

  @Delete('community/events/:id')
  @RequirePermissions(PERMISSIONS.COMMUNITY_EVENT_MANAGE)
  async deleteCommunityEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.communityService.deleteEvent(user.societyId, user.id, id);
  }

  // ==================== EMERGENCY CONTACTS ====================

  @Get('emergency-contacts')
  @RequirePermissions(PERMISSIONS.EMERGENCY_CONTACT_MANAGE)
  async getEmergencyContacts(@CurrentUser() user: AuthenticatedUser) {
    return this.communityService.getEmergencyContacts(user.societyId, false);
  }

  @Post('emergency-contacts')
  @RequirePermissions(PERMISSIONS.EMERGENCY_CONTACT_MANAGE)
  async createEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmergencyContactDto,
  ) {
    return this.communityService.createEmergencyContact(user.societyId, dto);
  }

  @Patch('emergency-contacts/:id')
  @RequirePermissions(PERMISSIONS.EMERGENCY_CONTACT_MANAGE)
  async updateEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEmergencyContactDto,
  ) {
    return this.communityService.updateEmergencyContact(
      user.societyId,
      id,
      dto,
    );
  }

  @Delete('emergency-contacts/:id')
  @RequirePermissions(PERMISSIONS.EMERGENCY_CONTACT_MANAGE)
  async deleteEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.communityService.deleteEmergencyContact(user.societyId, id);
  }
}
