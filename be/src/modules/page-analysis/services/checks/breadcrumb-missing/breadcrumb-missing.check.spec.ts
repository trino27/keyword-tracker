import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { BREADCRUMB_MISSING_CHECK } from './breadcrumb-missing.check';

const none = {
  breadcrumbs: [],
  jsonLd: { types: ['Article'], keywords: [], articleFields: [] },
  microdata: { types: [], articleFields: [] },
};

describe('BREADCRUMB_MISSING', () => {
  it('fails a page declaring none', () => {
    expect(
      BREADCRUMB_MISSING_CHECK.evaluate(makeCheckInput({ parsed: none })),
    ).toEqual(failsWith({}));
  });

  it('passes a BreadcrumbList inside @graph', () => {
    expect(
      BREADCRUMB_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            ...none,
            jsonLd: {
              types: ['WebPage', 'BreadcrumbList', 'ListItem'],
              keywords: [],
              articleFields: [],
            },
          },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('passes a Microdata BreadcrumbList', () => {
    expect(
      BREADCRUMB_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            ...none,
            microdata: { types: ['BreadcrumbList'], articleFields: [] },
          },
        }),
      ),
    ).toEqual(PASSES);
  });

  // vercel.com, 2026-10-11: the trail is in the Next.js payload, written by React in the
  // browser, where Google reads it. This crawler cannot confirm it, so it does not deny it.
  it('is not applicable to a BreadcrumbList an inline script inserts', () => {
    expect(
      BREADCRUMB_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: { ...none, scriptedSchemaTypes: ['BreadcrumbList'] },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('passes the lone step a home page declares', () => {
    expect(
      BREADCRUMB_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            ...none,
            breadcrumbs: [[{ position: 1, name: 'Home', item: null }]],
          },
        }),
      ),
    ).toEqual(PASSES);
  });
});
