import { mkdtempSync, readdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildErrorLog, LogWriter, resolveCorrelationId } from './index';

describe('resolveCorrelationId', () => {
  it('prefers x-correlation-id, then x-request-id', () => {
    expect(resolveCorrelationId({ 'x-correlation-id': 'abc-1', 'x-request-id': 'r' })).toBe('abc-1');
    expect(resolveCorrelationId({ 'x-request-id': 'req.2' })).toBe('req.2');
  });

  it('replaces unsafe or oversized ids with a fresh UUID', () => {
    expect(resolveCorrelationId({ 'x-correlation-id': 'bad\r\nInjected: 1' })).toMatch(/^[0-9a-f-]{36}$/);
    expect(resolveCorrelationId({ 'x-correlation-id': 'a'.repeat(500) })).toMatch(/^[0-9a-f-]{36}$/);
    expect(resolveCorrelationId({})).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('buildErrorLog', () => {
  const req = { method: 'GET', originalUrl: '/x', headers: {} };
  it('keeps stacks for 5xx only', () => {
    expect(buildErrorLog('svc', 'c', req, { statusCode: 500, message: 'boom', name: 'Error', stack: 's' }).error.stack).toBe('s');
    const warn = buildErrorLog('svc', 'c', req, { statusCode: 404, message: 'nope', name: 'NotFound', stack: 's' });
    expect(warn.error.stack).toBeNull();
    expect(warn.level).toBe('WARN');
  });
});

describe('LogWriter', () => {
  it('writes info to app-<date>.log and errors to both files', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'obs-'));
    const out = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const err = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const writer = new LogWriter({ logsDir: dir });
    writer.info({ a: 1 });
    writer.error({ b: 2 });
    writer.close();
    await new Promise((r) => setTimeout(r, 50));
    out.mockRestore();
    err.mockRestore();

    const files = readdirSync(dir).sort();
    expect(files).toHaveLength(2);
    const app = readFileSync(join(dir, files.find((f) => f.startsWith('app-'))!), 'utf8');
    const error = readFileSync(join(dir, files.find((f) => f.startsWith('error-'))!), 'utf8');
    expect(app.trim().split('\n')).toEqual(['{"a":1}', '{"b":2}']);
    expect(error.trim()).toBe('{"b":2}');
  });
});
