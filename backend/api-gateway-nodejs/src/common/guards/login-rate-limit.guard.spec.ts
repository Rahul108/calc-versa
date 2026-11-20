import { EventEmitter } from 'events';
import { HttpException } from '@nestjs/common';
import { LoginRateLimitGuard } from './login-rate-limit.guard';

function attempt(guard: LoginRateLimitGuard, status: number, ip = '1.2.3.4') {
  const response: any = Object.assign(new EventEmitter(), { statusCode: status, setHeader: jest.fn() });
  const request = { ip, method: 'POST', route: { path: '/auth/login' } };
  const context: any = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) };
  const allowed = guard.canActivate(context);
  response.emit('finish');
  return allowed;
}

describe('LoginRateLimitGuard', () => {
  beforeEach(() => LoginRateLimitGuard.reset());

  it('never blocks successful logins', () => {
    const guard = new LoginRateLimitGuard();
    for (let i = 0; i < 50; i++) expect(attempt(guard, 201)).toBe(true);
  });

  it('blocks after 10 failures from the same IP, but not other IPs', () => {
    const guard = new LoginRateLimitGuard();
    for (let i = 0; i < 10; i++) attempt(guard, 401);
    expect(() => attempt(guard, 401)).toThrow(HttpException);
    expect(attempt(guard, 201, '5.6.7.8')).toBe(true);
  });
});
