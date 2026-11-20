import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/** The authenticated caller, as returned by JwtStrategy.validate() / set by AdminGuard. */
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
}

/**
 * Injects the authenticated user. Use only behind JwtAuthGuard or AdminGuard;
 * throws 401 if no user is attached (a guard is missing).
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const user = ctx.switchToHttp().getRequest<Request>().user;
  if (!user) throw new UnauthorizedException('Authentication required');
  return user;
});
