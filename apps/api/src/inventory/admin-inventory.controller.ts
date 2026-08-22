import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { CurrentUser } from '../authorization/current-user.decorator';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  RecordMovementDto,
} from './dto/inventory.dto';

@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW)
  async listItems(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.listItems(user.societyId, {
      category,
      lowStockOnly: lowStock === 'true',
      search,
    });
  }

  @Get('items/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW)
  async getItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.inventoryService.getItemById(user.societyId, id);
  }

  @Post('items')
  @RequirePermissions(PERMISSIONS.INVENTORY_CREATE)
  async createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(user.societyId, user.id, dto);
  }

  @Put('items/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(user.societyId, id, user.id, dto);
  }

  @Post('items/:id/movements')
  @RequirePermissions(PERMISSIONS.INVENTORY_ADJUST)
  async recordMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RecordMovementDto,
  ) {
    return this.inventoryService.recordMovement(
      user.societyId,
      id,
      user.id,
      dto,
    );
  }
}
