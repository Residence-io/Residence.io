import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../authorization/current-user.decorator';
import { RequirePermissions } from '../authorization/authorization.decorators';
import type { RequestUser } from '../common/request-context';
import {
  CreatePropertyDto,
  CreateUnitDto,
  PropertyQueryDto,
} from './dto/property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}
  @Get() @RequirePermissions('RESIDENT_READ') list(
    @CurrentUser() user: RequestUser,
    @Query() query: PropertyQueryDto,
  ) {
    return this.properties.list(user, query);
  }
  @Get(':id') @RequirePermissions('RESIDENT_READ') detail(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.properties.detail(user, id);
  }
  @Post() @RequirePermissions('PROPERTY_MANAGE') create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.properties.create(user, dto);
  }
  @Post('units') @RequirePermissions('PROPERTY_MANAGE') createUnit(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateUnitDto,
  ) {
    return this.properties.createUnit(user, dto);
  }
}
