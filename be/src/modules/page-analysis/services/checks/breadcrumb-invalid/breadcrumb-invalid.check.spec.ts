import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import type { IBreadcrumbItem } from '../../../interfaces/parsed-page.interface';
import { BREADCRUMB_INVALID_CHECK } from './breadcrumb-invalid.check';

const step = (
  position: number | null,
  name: string | null,
  item: string | null,
): IBreadcrumbItem => ({ position, name, item });

const verdict = (...lists: IBreadcrumbItem[][]) =>
  BREADCRUMB_INVALID_CHECK.evaluate(
    makeCheckInput({ parsed: { breadcrumbs: lists } }),
  );

describe('BREADCRUMB_INVALID', () => {
  // Yoast's trail: the last step leaves `item` out, as Google allows.
  it('passes a trail whose last step has no item', () => {
    expect(
      verdict([
        step(1, 'Home', 'https://yoast.com/'),
        step(2, 'SEO blog', 'https://yoast.com/seo-blog/'),
        step(3, 'What is HTTP/2?', null),
      ]),
    ).toEqual(PASSES);
  });

  // Yoast's lone "Home" on yoast.com's home page: no trail to show, nothing to report.
  it('passes a trail of a single step', () => {
    expect(verdict([step(1, 'Home', 'https://yoast.com/')])).toEqual(PASSES);
  });

  it('fails a trail with no steps', () => {
    expect(evidenceOf(verdict([]))).toEqual([
      'BreadcrumbList with no ListItem — at least 2 are required',
    ]);
  });

  it('fails each step that lacks a required property', () => {
    const result = verdict([
      step(null, 'Home', 'https://a.example/'),
      step(2, null, null),
      step(3, 'Post', null),
    ]);
    expect(result).toEqual(failsWith({ count: 2 }));
    expect(evidenceOf(result)).toEqual([
      'ListItem 1 ("Home") — no integer position',
      'ListItem 2 — no name, no item URL',
    ]);
  });

  it('cannot be judged on a page with no BreadcrumbList', () => {
    expect(verdict()).toEqual(NOT_APPLICABLE);
  });
});
