import { escapeLike } from './escape-like';

describe('escapeLike', () => {
  it.each([
    ['seo', 'seo'],
    ['100%', '100\\%'],
    ['snake_case', 'snake\\_case'],
    ['back\\slash', 'back\\\\slash'],
  ])('%j → %j', (input, expected) => {
    expect(escapeLike(input)).toBe(expected);
  });
});
