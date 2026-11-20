import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';

const CACHE_TTL_MS = 60 * 1000;
const VERIFY_TIMEOUT_MS = 5000;

interface CachedUser {
  user: { id: string; username: string; email: string };
  expiresAt: number;
}

/**
 * Requires a valid CalcVersa user token on every request.
 *
 * The token is verified by the API Gateway (`GET /auth/me`), which owns user
 * identity — this service never sees the JWT secret. Successful verifications
 * are cached for 60s (keyed by a SHA-256 of the token) to avoid a round trip
 * per prompt.
 */
@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAuthGuard.name);
  private static readonly cache = new Map<string, CachedUser>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ') || header.length <= 'Bearer '.length) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const key = createHash('sha256').update(header).digest('hex');
    const now = Date.now();
    const cached = GatewayAuthGuard.cache.get(key);
    if (cached && cached.expiresAt > now) {
      request.user = cached.user;
      return true;
    }

    const gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3005';
    let res: Response;
    try {
      res = await fetch(`${gatewayUrl}/auth/me`, {
        headers: {
          Authorization: header,
          'x-correlation-id': request.headers?.['x-correlation-id'] ?? '',
        },
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });
    } catch (err: any) {
      this.logger.error(`Token verification against API Gateway failed: ${err.message}`);
      throw new ServiceUnavailableException('Authentication service unavailable');
    }

    if (!res.ok) {
      GatewayAuthGuard.cache.delete(key);
      throw new UnauthorizedException('Authentication token invalid or expired');
    }

    const profile = await res.json();
    const user = { id: profile.id, username: profile.username, email: profile.email };
    GatewayAuthGuard.cache.set(key, { user, expiresAt: now + CACHE_TTL_MS });
    if (GatewayAuthGuard.cache.size > 5000) {
      for (const [k, v] of GatewayAuthGuard.cache) if (v.expiresAt <= now) GatewayAuthGuard.cache.delete(k);
    }

    request.user = user;
    return true;
  }

  /** Test helper. */
  static clearCache() {
    GatewayAuthGuard.cache.clear();
  }
}
