import type { AuthenticatedUser } from '../auth/current-user.decorator';
import type { AppAccess } from '../auth/app-access.service';

declare global {
  namespace Express {
    interface Request {
      /** Set by CorrelationIdMiddleware. */
      correlationId?: string;
      /** Set by AppPermissionGuard after a successful check. */
      appAccess?: AppAccess;
    }
    // Passport attaches the value returned by JwtStrategy.validate().
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthenticatedUser {}
  }
}

export {};
