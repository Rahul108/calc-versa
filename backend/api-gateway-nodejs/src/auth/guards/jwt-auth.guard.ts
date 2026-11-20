import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../current-user.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication token missing or invalid');
    }
    return user;
  }
}
