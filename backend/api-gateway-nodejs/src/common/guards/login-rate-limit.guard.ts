import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

interface Window {
  failures: number;
  resetAt: number;
}

/**
 * In-memory, per-IP + per-route limiter for credential endpoints
 * (login/register). Only failed attempts (responses with status >= 400) count,
 * so legitimate users are not locked out by their own successful logins.
 * After 10 failures in a 15-minute window the route returns 429 until it resets.
 *
 * Single-instance only: with several gateway replicas, move this to a shared
 * store (e.g. @nestjs/throttler with Redis).
 */
@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private static readonly windows = new Map<string, Window>();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const ip = request.ip || request.socket?.remoteAddress || 'unknown';
    const key = `${ip}:${request.method}:${request.route?.path ?? request.originalUrl}`;
    const now = Date.now();

    let window = LoginRateLimitGuard.windows.get(key);
    if (!window || window.resetAt <= now) {
      window = { failures: 0, resetAt: now + WINDOW_MS };
      LoginRateLimitGuard.windows.set(key, window);
      this.prune(now);
    }

    if (window.failures >= MAX_FAILURES) {
      const retryAfterSec = Math.ceil((window.resetAt - now) / 1000);
      response.setHeader?.('Retry-After', String(retryAfterSec));
      throw new HttpException(
        `Too many failed attempts. Try again in ${retryAfterSec} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const tracked = window;
    response.once?.('finish', () => {
      if (response.statusCode >= 400) tracked.failures += 1;
    });
    return true;
  }

  private prune(now: number) {
    if (LoginRateLimitGuard.windows.size < 10_000) return;
    for (const [k, v] of LoginRateLimitGuard.windows) {
      if (v.resetAt <= now) LoginRateLimitGuard.windows.delete(k);
    }
  }

  /** Test helper. */
  static reset() {
    LoginRateLimitGuard.windows.clear();
  }
}
