/** Minimal request shape (Express-compatible) used to build log entries. */
export interface RequestLike {
  method: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
}

function requestMeta(req: RequestLike) {
  const ua = req.headers['user-agent'];
  return {
    method: req.method,
    url: req.originalUrl ?? req.url ?? '',
    origin_ip: req.ip || req.socket?.remoteAddress || 'unknown',
    user_agent: (Array.isArray(ua) ? ua[0] : ua) || 'Unknown',
  };
}

export function buildAccessLog(service: string, correlationId: string, req: RequestLike, statusCode: number, durationMs: number) {
  const meta = requestMeta(req);
  return {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    service,
    correlation_id: correlationId,
    request: meta,
    duration_ms: durationMs,
    status_code: statusCode,
    message: `${meta.method} ${meta.url} ${statusCode} - ${durationMs}ms`,
  };
}

export interface ErrorInfo {
  statusCode: number;
  message: unknown;
  name: string;
  stack?: string;
}

/**
 * Log entry for a failed request. Stack traces are only included for 5xx errors;
 * expected 4xx responses (validation, auth) do not need them and they bloat logs.
 */
export function buildErrorLog(service: string, correlationId: string, req: RequestLike, err: ErrorInfo) {
  return {
    timestamp: new Date().toISOString(),
    level: err.statusCode >= 500 ? 'ERROR' : 'WARN',
    service,
    correlation_id: correlationId,
    request: requestMeta(req),
    status_code: err.statusCode,
    message: err.message,
    error: {
      code: err.name,
      stack: err.statusCode >= 500 ? err.stack ?? null : null,
    },
  };
}

/** Standard JSON error body returned to clients by every Node service. */
export function buildErrorResponse(service: string, correlationId: string, path: string, err: ErrorInfo) {
  return {
    statusCode: err.statusCode,
    error: err.name,
    message: err.message,
    service,
    path,
    correlationId,
    timestamp: new Date().toISOString(),
  };
}
