import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { GatewayAuthGuard } from './gateway-auth.guard';

function ctx(headers: Record<string, string>) {
  const request: any = { headers };
  return {
    request,
    context: { switchToHttp: () => ({ getRequest: () => request }) } as any,
  };
}

describe('GatewayAuthGuard', () => {
  const realFetch = global.fetch;
  beforeEach(() => GatewayAuthGuard.clearCache());
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('rejects requests without a bearer token', async () => {
    const { context } = ctx({});
    await expect(new GatewayAuthGuard().canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects tokens the API Gateway does not accept', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 }) as any;
    const { context } = ctx({ authorization: 'Bearer bad' });
    await expect(new GatewayAuthGuard().canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('accepts valid tokens, attaches the user, and caches the result', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'u1', username: 'jane', email: 'j@example.com', password: 'never' }),
    });
    global.fetch = fetchMock as any;

    const first = ctx({ authorization: 'Bearer good' });
    await expect(new GatewayAuthGuard().canActivate(first.context)).resolves.toBe(true);
    expect(first.request.user).toEqual({ id: 'u1', username: 'jane', email: 'j@example.com' });

    const second = ctx({ authorization: 'Bearer good' });
    await new GatewayAuthGuard().canActivate(second.context);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when the API Gateway is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as any;
    const { context } = ctx({ authorization: 'Bearer x' });
    await expect(new GatewayAuthGuard().canActivate(context)).rejects.toThrow(ServiceUnavailableException);
  });
});
