import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { AssetsService } from './assets.service';
import {
  CreateAssetDto,
  UpdateAssetDto,
  UpdateAssetStatusDto,
  AttachAssetDocumentDto,
} from './dto/asset.dto';
import { AssetStatus, AssetCategory } from '../generated/prisma/client';

@Controller('admin/assets')
export class AdminAssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  async listAssets(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: AssetStatus,
    @Query('category') category?: AssetCategory,
    @Query('facilityId') facilityId?: string,
    @Query('search') search?: string,
  ) {
    return this.assetsService.listAssets(user.societyId, {
      status,
      category,
      facilityId,
      search,
    });
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ASSET_CREATE)
  async createAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAssetDto,
  ) {
    return this.assetsService.createAsset(user.societyId, user.id, dto);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ASSET_VIEW)
  async getAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.assetsService.getAssetById(user.societyId, id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ASSET_UPDATE)
  async updateAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.updateAsset(user.societyId, id, user.id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.ASSET_MANAGE)
  async updateAssetStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssetStatusDto,
  ) {
    return this.assetsService.updateAssetStatus(
      user.societyId,
      id,
      user.id,
      dto,
    );
  }

  @Post(':id/documents')
  @RequirePermissions(PERMISSIONS.ASSET_UPDATE)
  async attachDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AttachAssetDocumentDto,
  ) {
    return this.assetsService.attachDocument(user.societyId, id, user.id, dto);
  }
}
