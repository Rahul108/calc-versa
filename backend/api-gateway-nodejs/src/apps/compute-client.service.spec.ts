import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ComputeClientService } from './compute-client.service';

const respond = (status: number, body: unknown) =>
  jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (body === undefined) throw new Error('not json');
      return body;
    },
  });

describe('ComputeClientService', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('returns results and forwards the correlation id', async () => {
    const fetchMock = respond(200, { results: { r: 2 }, duration_ms: 0.1 });
    global.fetch = fetchMock as any;
    const out = await new ComputeClientService().evaluate({ a: 1 }, { rules: [] }, 'corr-1');
    expect(out).toEqual({ results: { r: 2 }, duration_ms: 0.1 });
    expect(fetchMock.mock.calls[0][1].headers['x-correlation-id']).toBe('corr-1');
  });

  it('maps engine 4xx to 400 with the engine message', async () => {
    global.fetch = respond(400, { message: 'bad formula' }) as any;
    await expect(new ComputeClientService().evaluate({}, {})).rejects.toThrow(
      new BadRequestException('bad formula'),
    );
  });

  it('maps engine 5xx or malformed bodies to 502', async () => {
    global.fetch = respond(500, undefined) as any;
    await expect(new ComputeClientService().evaluate({}, {})).rejects.toThrow(BadGatewayException);
    global.fetch = respond(200, { nope: true }) as any;
    await expect(new ComputeClientService().evaluate({}, {})).rejects.toThrow(BadGatewayException);
  });

  it('maps network failures and timeouts to 503', async () => {
    global.fetch = jest.fn().mockRejectedValue(Object.assign(new Error('t'), { name: 'TimeoutError' })) as any;
    await expect(new ComputeClientService().evaluate({}, {})).rejects.toThrow(ServiceUnavailableException);
  });
});
