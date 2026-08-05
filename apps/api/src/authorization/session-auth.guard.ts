import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  ALLOW_FORCED_CHANGE_KEY,
  PUBLIC_KEY,
} from './authorization.decorators';
import { PrismaService } from '../prisma/prisma.service';

// ─── Minimal HS256 JWT verifier (no external deps) ───────────────────────────
interface SupabaseJwtPayload {
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  app_metadata?: {
    legacyId?: string;
    societyId?: string;
    username?: string;
    roles?: string[];
  };
}

function base64urlDecode(input: string): Buffer {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );
  return Buffer.from(padded, 'base64');
}

function verifySupabaseJwt(token: string, secret: string): SupabaseJwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  // Verify HMAC-SHA-256 signature
  const expectedSig = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');
  const suppliedSig = Buffer.from(signatureB64, 'base64url').toString(
    'base64url',
  );

  const a = Buffer.from(expectedSig);
  const b = Buffer.from(suppliedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('JWT signature verification failed');
  }

  const payload = JSON.parse(
    base64urlDecode(payloadB64).toString(),
  ) as SupabaseJwtPayload;

  // Check expiry
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT has expired');
  }

  return payload;
}
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class SessionAuthGuard implements CanActivate {
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

    // ── Phase S2: Try Supabase JWT first when feature is enabled ──────────────
    const supabaseEnabled = this.config.get<boolean>(
      'supabase.authEnabled',
      false,
    );
    if (supabaseEnabled) {
      const jwtResult = await this.trySupabaseJwt(request, context);
      if (jwtResult === true) return true;
      // jwtResult === false means no JWT found → fall through to opaque session
      // jwtResult === 'invalid' means JWT found but bad → reject immediately
      if (jwtResult === 'invalid')
        throw new UnauthorizedException('Your session is no longer valid.');
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Existing opaque session logic ─────────────────────────────────────────
    const cookieName = this.config.getOrThrow<string>('session.cookieName');
    const rawToken = request.cookies?.[cookieName] as string | undefined;
    if (!rawToken)
      throw new UnauthorizedException('Authentication is required.');
    const tokenHash = this.digest(rawToken);
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== 'ACTIVE'
    )
      throw new UnauthorizedException('Your session is no longer valid.');
    const roles = session.user.roles
      .filter((entry) => entry.role.active)
      .map((entry) => entry.role.code);
    const permissions = [
      ...new Set(
        session.user.roles.flatMap((entry) =>
          entry.role.permissions.map((grant) => grant.permission.code),
        ),
      ),
    ];
    const csrfToken =
      (request.cookies?.[`${cookieName}_csrf`] as string | undefined) ?? '';
    request.user = {
      id: session.user.id,
      societyId: session.user.societyId,
      username: session.user.username,
      displayName: session.user.displayName,
      forcePasswordChange: session.user.forcePasswordChange,
      roles,
      permissions,
      csrfToken,
      sessionId: session.id,
    };
    const mayChange = this.reflector.getAllAndOverride<boolean>(
      ALLOW_FORCED_CHANGE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (session.user.forcePasswordChange && !mayChange)
      throw new UnauthorizedException('A password change is required.');
    return true;
  }

  /**
   * Attempts Supabase JWT auth.
   * Returns: true (success) | false (no JWT present) | 'invalid' (JWT present but bad)
   */
  private async trySupabaseJwt(
    request: Request,
    context: ExecutionContext,
  ): Promise<true | false | 'invalid'> {
    const token = this.extractBearerToken(request);
    if (!token) return false;

    const jwtSecret = this.config.get<string>('supabase.jwtSecret');
    if (!jwtSecret) return false;

    let payload: SupabaseJwtPayload;
    try {
      payload = verifySupabaseJwt(token, jwtSecret);
    } catch {
      return 'invalid';
    }

    const legacyId = payload.app_metadata?.legacyId;
    if (!legacyId) return 'invalid';

    const user = await this.prisma.userAccount.findUnique({
      where: { id: legacyId },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') return 'invalid';

    const roles = user.roles
      .filter((entry) => entry.role.active)
      .map((entry) => entry.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((entry) =>
          entry.role.permissions.map((grant) => grant.permission.code),
        ),
      ),
    ];

    request.user = {
      id: user.id,
      societyId: user.societyId,
      username: user.username,
      displayName: user.displayName,
      forcePasswordChange: user.forcePasswordChange,
      roles,
      permissions,
      csrfToken: '',
      sessionId: `supabase:${payload.sub}`,
    };
    // Flag for CsrfGuard — JWT Bearer is CSRF-safe (no auto-send by browser)
    (request as Request & { supabaseJwt?: boolean }).supabaseJwt = true;

    const mayChange = this.reflector.getAllAndOverride<boolean>(
      ALLOW_FORCED_CHANGE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (user.forcePasswordChange && !mayChange) {
      throw new UnauthorizedException('A password change is required.');
    }

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }

  private digest(value: string): string {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('session.secret'),
    )
      .update(value)
      .digest('hex');
  }

  static tokensMatch(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
