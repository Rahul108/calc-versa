import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const { method, originalUrl, ip, headers } = request;
    const correlationId =
      headers[CORRELATION_ID_HEADER] || (request as any).correlationId || 'N/A';
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = response.statusCode;

        const logPayload = {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'ai-assistant-service-nodejs',
          correlation_id: correlationId,
          request: {
            method,
            url: originalUrl,
            origin_ip: ip || request.socket?.remoteAddress || '127.0.0.1',
            user_agent: userAgent,
          },
          duration_ms: durationMs,
          status_code: statusCode,
          message: `${method} ${originalUrl} ${statusCode} - ${durationMs}ms`,
        };

        // Output structured JSON log
        console.log(JSON.stringify(logPayload));
      }),
    );
  }
}
