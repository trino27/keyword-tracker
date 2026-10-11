import { describe, expect, it } from 'vitest';
import { inclusionBarViolations } from './inclusion-bar.util';

const google = {
  title: 'Google Search Central: SEO Starter Guide',
  url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
};
const ahrefs = {
  title: 'Ahrefs: SEO audit',
  url: 'https://ahrefs.com/blog/seo-audit/',
};

describe('inclusionBarViolations', () => {
  it('flags an entry above notice whose every source is industry', () => {
    expect(
      inclusionBarViolations({
        ONLY_AHREFS: { severity: 'warning', sources: [ahrefs] },
      }),
    ).toEqual(['ONLY_AHREFS']);
  });

  it('passes one with a first-party source beside the industry one', () => {
    expect(
      inclusionBarViolations({
        BOTH: { severity: 'error', sources: [ahrefs, google] },
      }),
    ).toEqual([]);
  });

  it('passes an industry-only notice', () => {
    expect(
      inclusionBarViolations({
        NOTICE: { severity: 'notice', sources: [ahrefs] },
      }),
    ).toEqual([]);
  });
});
