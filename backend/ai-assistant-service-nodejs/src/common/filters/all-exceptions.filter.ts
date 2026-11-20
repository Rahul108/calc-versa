import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  SERVICE_NAME,
  buildErrorLog,
  buildErrorResponse,
  logWriter,
  resolveCorrelationId,
} from '../observability';

/**
 * Converts every exception into the standard error body and logs it.
 * Unexpected (non-HTTP) errors are logged in full but returned to the client as a
 * generic 500, so internal details (SQL, stack, hostnames) never leak.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request.correlationId ?? resolveCorrelationId(request.headers);

    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const err = exception instanceof Error ? exception : new Error(String(exception));

    let clientMessage: unknown = 'Internal server error';
    if (isHttp) {
      const body = exception.getResponse();
      clientMessage = typeof body === 'object' && body !== null ? (body as { message?: unknown }).message ?? err.message : body;
    }

    const name = isHttp ? err.name : 'InternalServerError';
    logWriter.error(
      buildErrorLog(SERVICE_NAME, correlationId, request, {
        statusCode,
        message: isHttp ? clientMessage : err.message,
        name: err.name,
        stack: err.stack,
      }),
    );

    response
      .status(statusCode)
      .json(buildErrorResponse(SERVICE_NAME, correlationId, request.originalUrl, { statusCode, message: clientMessage, name }));
  }
}
