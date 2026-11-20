import { LogWriter } from '../../../../libs/observability/src';

export {
  CORRELATION_ID_HEADER,
  resolveCorrelationId,
  buildAccessLog,
  buildErrorLog,
  buildErrorResponse,
} from '../../../../libs/observability/src';

export const SERVICE_NAME = 'api-gateway-nodejs';

/** Process-wide structured log writer (stdout + daily files under ./logs). */
export const logWriter = new LogWriter();
