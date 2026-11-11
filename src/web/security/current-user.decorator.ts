import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './session.service.js';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
  return request.user as AuthenticatedUser;
});

export const OptionalUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser | null => {
  const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
  return request.user ?? null;
});
