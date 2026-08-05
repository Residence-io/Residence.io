import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../authorization/current-user.decorator';
import {
  AllowForcedPasswordChange,
  RequirePermissions,
  Roles,
} from '../authorization/authorization.decorators';
import type { RequestUser } from '../common/request-context';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @AllowForcedPasswordChange()
  @Get('me/sessions')
  async sessions(@CurrentUser() user: RequestUser) {
    return this.prisma.userSession.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        issuedAt: true,
        lastSeenAt: true,
        expiresAt: true,
        sourceIp: true,
        userAgent: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  @AllowForcedPasswordChange()
  @Post('me/sessions/revoke-others')
  @HttpCode(204)
  async revokeOthers(@CurrentUser() user: RequestUser): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId: user.id, id: { not: user.sessionId }, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedReason: 'USER_REVOKED_OTHER_SESSIONS',
      },
    });
  }

  @Roles('SUPER_ADMINISTRATOR', 'ADMINISTRATOR')
  @RequirePermissions('ACCESS_ADMIN_MANAGE')
  @Get('administration/access-check')
  adminAccessCheck() {
    return { authorized: true };
  }
}
