import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { type AuthenticatedUser, SessionService } from './session.service.js';

type SessionRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const user = await this.sessions.read(request);
    if (!user) throw new UnauthorizedException('Log in to continue.');
    if (user.suspended) throw new ForbiddenException('This account is suspended. Contact Àmì support.');
    request.user = user;
    return true;
  }
}

@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const user = await this.sessions.read(request);
    if (user && !user.suspended) request.user = user;
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    if (!request.user?.isAdmin) throw new ForbiddenException('Admins only.');
    return true;
  }
}

export type { AuthenticatedUser };
