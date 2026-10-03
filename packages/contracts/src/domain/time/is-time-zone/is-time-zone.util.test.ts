import { describe, expect, it } from 'vitest';
import { isTimeZone } from './is-time-zone.util';

describe('isTimeZone', () => {
  it('accepts an IANA zone name', () => {
    expect(isTimeZone('America/Toronto')).toBe(true);
    expect(isTimeZone('UTC')).toBe(true);
  });

  it('refuses a name Intl does not know', () => {
    expect(isTimeZone('Mars/Base')).toBe(false);
  });

  it('refuses an empty string', () => {
    expect(isTimeZone('')).toBe(false);
  });
});
