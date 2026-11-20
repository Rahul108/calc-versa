const DEFAULT_ORIGINS = ['http://localhost:4200', 'http://localhost:4300'];

/** Allowed browser origins, from comma-separated CORS_ORIGINS (no wildcard). */
export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o !== '*');
}
