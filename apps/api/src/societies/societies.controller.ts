import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('societies')
@Controller('societies')
export class SocietiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('current')
  current(@CurrentUser() user: RequestUser) {
    return this.prisma.society.findUniqueOrThrow({
      where: { id: user.societyId },
      select: {
        id: true,
        slug: true,
        name: true,
        timeZone: true,
        currency: true,
        status: true,
      },
    });
  }
}
