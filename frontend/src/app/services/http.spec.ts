import { ApiError, UNAUTHORIZED_EVENT, apiFetch, getStoredToken, getTokenExpiry, setStoredToken } from './http';

import { jsonResponse, mockFetch } from '../test-utils';

const respond = (status: number, body: unknown) => mockFetch(() => jsonResponse(status, body));

describe('apiFetch', () => {
  beforeEach(() => localStorage.clear());

  it('sends the bearer token and returns parsed JSON', async () => {
    setStoredToken('tok');
    const fetchMock = respond(200, { ok: 1 });
    await expect(apiFetch('http://x', '/a')).resolves.toEqual({ ok: 1 });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('surfaces the server message (including validation arrays)', async () => {
    respond(400, { message: ['name must be a string', 'name should not be empty'] });
    await expect(apiFetch('http://x', '/a')).rejects.toThrow('name must be a string; name should not be empty');
  });

  it('on 401 clears the token and notifies the app', async () => {
    setStoredToken('expired');
    const listener = jest.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    respond(401, { message: 'Unauthorized' });

    await expect(apiFetch('http://x', '/a')).rejects.toMatchObject({ status: 401 });
    expect(getStoredToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('reports network failures as status 0 with a readable message', async () => {
    mockFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    const err = (await apiFetch('http://x', '/a').catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toMatch(/Cannot reach the server/);
  });
});

describe('getTokenExpiry', () => {
  it('reads exp from a JWT and tolerates garbage', () => {
    const payload = btoa(JSON.stringify({ exp: 1234 })).replace(/=+$/, '');
    expect(getTokenExpiry(`h.${payload}.s`)).toBe(1234);
    expect(getTokenExpiry('nope')).toBeNull();
  });
});
