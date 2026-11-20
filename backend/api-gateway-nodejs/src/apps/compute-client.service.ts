import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CORRELATION_ID_HEADER } from '../common/middleware/correlation-id.middleware';

export interface ComputeResult {
  results: Record<string, unknown>;
  duration_ms: number;
}

/**
 * HTTP client for the Go compute engine (`POST /evaluate`).
 *
 * Error mapping:
 * - compute returns 4xx            -> 400 with the engine's message (bad formula / inputs)
 * - compute returns 5xx / bad body -> 502 Bad Gateway
 * - timeout / connection refused   -> 503 Service Unavailable
 */
@Injectable()
export class ComputeClientService {
  private readonly logger = new Logger(ComputeClientService.name);

  private get baseUrl(): string {
    return process.env.COMPUTE_SERVICE_URL || 'http://localhost:8085';
  }

  private get timeoutMs(): number {
    const parsed = parseInt(process.env.COMPUTE_TIMEOUT_MS || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
  }

  async evaluate(
    payload: Record<string, unknown>,
    formulaConfig: Record<string, unknown>,
    correlationId?: string,
  ): Promise<ComputeResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (correlationId) headers[CORRELATION_ID_HEADER] = correlationId;

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/evaluate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ payload, formulaConfig }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err: any) {
      const reason = err?.name === 'TimeoutError' ? `timed out after ${this.timeoutMs}ms` : err?.message;
      this.logger.error(`Compute engine request failed: ${reason}`);
      throw new ServiceUnavailableException(`Compute engine unavailable (${reason})`);
    }

    const body = await response.json().catch(() => null);

    if (response.status >= 400 && response.status < 500) {
      throw new BadRequestException(body?.message || 'Formula computation failed');
    }
    if (!response.ok || !body || typeof body.results !== 'object' || body.results === null) {
      this.logger.error(`Compute engine returned HTTP ${response.status} with an unexpected body`);
      throw new BadGatewayException('Compute engine returned an invalid response');
    }

    return { results: body.results, duration_ms: Number(body.duration_ms) || 0 };
  }
}
