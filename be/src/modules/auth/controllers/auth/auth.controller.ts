import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ISessionUser } from '@app/contracts';
import { CurrentSessionUser } from '@core/decorators/current-scope/current-scope.decorator';
import { Public } from '@core/decorators/public/public.decorator';
import { LoginDto } from '../../dto/login/login.dto';
import { LoginThrottlerGuard } from '../../guards/login-throttler/login-throttler.guard';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../../guards/session/session-cookie';
import { AuthService } from '../../services/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: ISessionUser }> {
    const { user, token } = await this.auth.signIn(body.email, body.password);
    response.cookie(
      SESSION_COOKIE,
      token,
      sessionCookieOptions(request.secure),
    );
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = (request.cookies as Record<string, string>)[SESSION_COOKIE];
    await this.auth.signOut(token);
    const { maxAge: _maxAge, ...options } = sessionCookieOptions(
      request.secure,
    );
    response.clearCookie(SESSION_COOKIE, options);
  }

  @Get('me')
  me(@CurrentSessionUser() user: ISessionUser): { user: ISessionUser } {
    return { user };
  }
}
