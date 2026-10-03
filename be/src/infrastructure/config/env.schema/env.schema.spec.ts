import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const valid = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    PORT: '3000',
    UNMODELLED: 'kept',
  };

  it('returns the original config untouched on success', () => {
    expect(validateEnv(valid)).toBe(valid);
  });

  it('rejects a DATABASE_URL with no scheme', () => {
    expect(() =>
      validateEnv({ ...valid, DATABASE_URL: 'db-host/app' }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects a missing DATABASE_URL', () => {
    const { DATABASE_URL: _omitted, ...rest } = valid;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('reports every problem at once', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(
      /DATABASE_URL[\s\S]*PORT/,
    );
  });
});
