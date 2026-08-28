import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string) ||
      (request as any).correlationId ||
      'N/A';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || (exception as any).message
        : (exception as any).message || 'Internal Server Error';

    const errorPayload = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'ai-assistant-service-nodejs',
      correlation_id: correlationId,
      request: {
        method: request.method,
        url: request.originalUrl,
        origin_ip: request.ip || request.socket?.remoteAddress || '127.0.0.1',
        user_agent: request.headers['user-agent'] || 'Unknown',
      },
      status_code: status,
      message,
      error: {
        code: (exception as any).name || 'InternalServerError',
        stack: (exception as any).stack || null,
      },
    };

    // Output structured JSON error log
    console.error(JSON.stringify(errorPayload));

    response.status(status).json({
      statusCode: status,
      error: (exception as any).name || 'Error',
      message,
      service: 'ai-assistant-service-nodejs',
      path: request.originalUrl,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  }
}
