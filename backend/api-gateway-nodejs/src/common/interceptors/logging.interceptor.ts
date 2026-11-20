import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { SERVICE_NAME, buildAccessLog, logWriter, resolveCorrelationId } from '../observability';

/** Logs every successful request (failures are logged by AllExceptionsFilter). */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const correlationId = request.correlationId ?? resolveCorrelationId(request.headers);
        logWriter.info(
          buildAccessLog(SERVICE_NAME, correlationId, request, response.statusCode, Date.now() - startTime),
        );
      }),
    );
  }
}
