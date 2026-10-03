import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { IAuthenticatedRequest } from '@core/decorators/current-scope/current-scope.decorator';
import { IS_PUBLIC_KEY } from '@core/decorators/public/public.decorator';
import { SessionRequiredException } from '../../exceptions/auth.exceptions';
import { AuthService } from '../../services/auth/auth.service';
import { createUserScope } from './create-user-scope';
import { SESSION_COOKIE, sessionCookieOptions } from './session-cookie';

/**
 * The global guard: every route requires a live session unless it carries @Public().
 * Registered as APP_GUARD by AuthModule, so a new controller is protected before
 * anybody thinks about it.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const http = context.switchToHttp();
    const request = http.getRequest<Request & IAuthenticatedRequest>();
    const token = (request.cookies as Record<string, unknown> | undefined)?.[
      SESSION_COOKIE
    ];
    if (typeof token !== 'string' || token.length === 0) {
      throw new SessionRequiredException();
    }

    const session = await this.auth.resolveSession(token);
    if (!session) throw new SessionRequiredException();

    request.userScope = createUserScope(session.user);
    request.sessionUser = session.user;

    if (session.slid) {
      http
        .getResponse<Response>()
        .cookie(SESSION_COOKIE, token, sessionCookieOptions(request.secure));
    }
    return true;
  }
}
