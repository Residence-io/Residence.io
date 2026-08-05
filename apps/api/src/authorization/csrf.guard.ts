import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PUBLIC_KEY } from './authorization.decorators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<Request>();
    if (
      !['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) ||
      !request.user
    )
      return true;

    // Phase S2: Supabase JWT Bearer auth is inherently CSRF-safe.
    // Browsers never auto-send Authorization headers cross-origin.
    if ((request as Request & { supabaseJwt?: boolean }).supabaseJwt === true) {
      return true;
    }

    const supplied = request.header('x-csrf-token');
    if (!supplied)
      throw new ForbiddenException('The security token is missing or invalid.');
    const session = await this.prisma.userSession.findUnique({
      where: { id: request.user.sessionId },
      select: { csrfTokenHash: true },
    });
    const actual = createHmac(
      'sha256',
      this.config.getOrThrow<string>('session.secret'),
    )
      .update(supplied)
      .digest('hex');
    if (!session || !this.matches(session.csrfTokenHash, actual))
      throw new ForbiddenException('The security token is missing or invalid.');
    return true;
  }

  private matches(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
