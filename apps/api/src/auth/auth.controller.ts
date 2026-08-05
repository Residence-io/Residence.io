import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import {
  AllowForcedPasswordChange,
  Public,
} from '../authorization/authorization.decorators';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto, this.metadata(request));
    const cookieName = this.config.getOrThrow<string>('session.cookieName');
    const common = {
      secure: this.config.getOrThrow<boolean>('session.secure'),
      sameSite: 'strict' as const,
      path: '/',
      maxAge: result.expiresAt.getTime() - Date.now(),
    };
    response.cookie(cookieName, result.rawSessionToken, {
      ...common,
      httpOnly: true,
    });
    response.cookie(`${cookieName}_csrf`, result.csrfToken, {
      ...common,
      httpOnly: false,
    });
    return { user: result.user };
  }

  @AllowForcedPasswordChange()
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return {
      user: {
        id: user.id,
        societyId: user.societyId,
        username: user.username,
        displayName: user.displayName,
        forcePasswordChange: user.forcePasswordChange,
        roles: user.roles,
        permissions: user.permissions,
        csrfToken: user.csrfToken,
      },
    };
  }

  @AllowForcedPasswordChange()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(user, this.metadata(request));
    const cookieName = this.config.getOrThrow<string>('session.cookieName');
    response.clearCookie(cookieName, { path: '/' });
    response.clearCookie(`${cookieName}_csrf`, { path: '/' });
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(202)
  async forgot(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    await this.auth.forgotPassword(dto, this.metadata(request));
    return {
      message: 'If the account exists, reset instructions will be sent.',
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(204)
  reset(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.auth.resetPassword(dto, this.metadata(request));
  }

  @AllowForcedPasswordChange()
  @Post('change-password')
  @HttpCode(204)
  change(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    return this.auth.changePassword(user, dto, this.metadata(request));
  }

  private metadata(request: Request) {
    return {
      correlationId: request.correlationId,
      sourceIp: request.ip,
      userAgent: request.header('user-agent'),
    };
  }
}
