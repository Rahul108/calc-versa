const TOKEN_KEY = 'calcversa_jwt_token';
const LEGACY_KEYS = ['calcversa_username', 'calcversa_is_admin'];

export const UNAUTHORIZED_EVENT = 'calcversa:unauthorized';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode): the session lasts for this page only
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/** Seconds-since-epoch expiry from a JWT, or null if it cannot be read. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Attach the stored token (default true). */
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * fetch wrapper used by every API call:
 * - attaches the bearer token,
 * - turns non-2xx responses into ApiError with the server's message,
 * - on 401 for an authenticated call, clears the token and emits UNAUTHORIZED_EVENT
 *   so the AuthProvider can send the user to the login page.
 */
export async function apiFetch<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? getStoredToken() : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ApiError(0, 'Cannot reach the server. Check that the CalcVersa services are running and try again.');
  }

  const text = await res.text();
  let data: { message?: string | string[]; correlationId?: string } | null = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth && token) {
      clearStoredToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw.join('; ') : raw || `Request failed (HTTP ${res.status})`;
    throw new ApiError(res.status, message, data?.correlationId);
  }

  return data as unknown as T;
}
