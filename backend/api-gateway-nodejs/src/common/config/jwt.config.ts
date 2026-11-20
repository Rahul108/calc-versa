import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

const MIN_SECRET_LENGTH = 32;
let cachedSecret: string | undefined;

/**
 * Returns the JWT signing secret.
 *
 * - JWT_SECRET set and >= 32 chars: used as-is.
 * - production: missing or short JWT_SECRET aborts startup.
 * - other environments: missing/short secret falls back to a random per-process
 *   secret (tokens stop working after a restart) and logs a warning.
 *
 * There is intentionally no hard-coded default.
 */
export function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= MIN_SECRET_LENGTH) {
    cachedSecret = secret;
    return cachedSecret;
  }

  const problem = secret
    ? `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`
    : 'JWT_SECRET is not set';

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${problem}. Refusing to start in production.`);
  }

  new Logger('JwtConfig').warn(
    `${problem}. Using a random ephemeral secret; issued tokens will be invalid after restart.`,
  );
  cachedSecret = randomBytes(48).toString('hex');
  return cachedSecret;
}

/** Test helper: forget the cached secret so env changes are picked up. */
export function resetJwtSecretCache(): void {
  cachedSecret = undefined;
}
