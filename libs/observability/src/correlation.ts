import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';
const MAX_LENGTH = 128;
const SAFE = /^[A-Za-z0-9._:-]+$/;

type HeaderBag = Record<string, string | string[] | undefined>;

/**
 * Returns the caller's correlation id (x-correlation-id, then x-request-id) or a
 * new UUID. Incoming values are length-limited and restricted to a safe character
 * set so they cannot inject content into logs or response headers.
 */
export function resolveCorrelationId(headers: HeaderBag): string {
  for (const name of [CORRELATION_ID_HEADER, REQUEST_ID_HEADER]) {
    const raw = headers[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && value.length <= MAX_LENGTH && SAFE.test(value)) return value;
  }
  return randomUUID();
}
