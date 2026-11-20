import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CORRELATION_ID_HEADER, resolveCorrelationId } from '../observability';

export { CORRELATION_ID_HEADER };

/** Assigns every request a correlation id (reusing a safe incoming one) and echoes it back. */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = resolveCorrelationId(req.headers);
    req.headers[CORRELATION_ID_HEADER] = correlationId;
    req.correlationId = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}
