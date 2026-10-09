import { describe, expect, it } from 'vitest';
import {
  SITE_CHECK_CATALOGUE,
  SITE_CHECK_CODES,
} from './site-check-catalogue.constant';

describe('SITE_CHECK_CATALOGUE', () => {
  it('explains every site check at length, with https sources and a skip reason', () => {
    for (const code of SITE_CHECK_CODES) {
      const entry = SITE_CHECK_CATALOGUE[code];
      expect(
        entry.explanation.split(/[.!?](\s|$)/).filter((s) => s.trim()).length,
      ).toBeGreaterThan(1);
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources)
        expect(new URL(source.url).protocol).toBe('https:');
      expect(entry.skipReason).toMatch(/\S/);
    }
  });
});
