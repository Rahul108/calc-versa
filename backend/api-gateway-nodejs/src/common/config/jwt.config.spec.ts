import { getJwtSecret, resetJwtSecretCache } from './jwt.config';

describe('getJwtSecret', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    resetJwtSecretCache();
  });

  it('refuses to start in production without a strong secret', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = 'short';
    expect(() => getJwtSecret()).toThrow(/at least 32/);
  });

  it('uses the configured secret', () => {
    process.env.JWT_SECRET = 'x'.repeat(40);
    expect(getJwtSecret()).toBe('x'.repeat(40));
  });

  it('never falls back to the old hard-coded secret in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    const secret = getJwtSecret();
    expect(secret).not.toBe('calcversa_secret_jwt_key_2026');
    expect(secret.length).toBeGreaterThanOrEqual(64);
  });
});
