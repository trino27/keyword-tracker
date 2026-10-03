import { assertTestDatabase } from './assert-test-database';

describe('assertTestDatabase', () => {
  it('refuses a database whose name does not end in _test', () => {
    expect(() =>
      assertTestDatabase('postgresql://tracker:pw@localhost:5432/seo_tracker'),
    ).toThrow(/seo_tracker.*_test/);
  });

  it('accepts a database whose name ends in _test', () => {
    expect(
      assertTestDatabase(
        'postgresql://tracker:pw@localhost:5432/seo_tracker_test',
      ),
    ).toBe('postgresql://tracker:pw@localhost:5432/seo_tracker_test');
  });

  it('refuses a missing url instead of falling back to anything', () => {
    expect(() => assertTestDatabase(undefined)).toThrow(/TEST_DATABASE_URL/);
  });

  it('refuses a url it cannot parse', () => {
    expect(() => assertTestDatabase('not a url')).toThrow(/TEST_DATABASE_URL/);
  });
});
