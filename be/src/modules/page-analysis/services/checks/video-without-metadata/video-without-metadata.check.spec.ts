import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import { makeCheckInput } from '../_testing/make-check-input';
import { VIDEO_WITHOUT_METADATA_CHECK } from './video-without-metadata.check';

const EMBED = '<iframe src="https://www.youtube.com/embed/abc"></iframe>';

const verdict = (parsed: Partial<IParsedPage> = {}) =>
  VIDEO_WITHOUT_METADATA_CHECK.evaluate(
    makeCheckInput({
      parsed: {
        videos: [EMBED],
        jsonLd: { types: ['Article'], keywords: [], articleFields: [] },
        microdata: { types: [], articleFields: [] },
        openGraph: { 'og:title': 'A post' },
        ...parsed,
      },
    }),
  );

describe('VIDEO_WITHOUT_METADATA', () => {
  it('passes a video with VideoObject in JSON-LD', () => {
    expect(
      verdict({
        jsonLd: {
          types: ['Article', 'VideoObject'],
          keywords: [],
          articleFields: [],
        },
      }),
    ).toEqual(PASSES);
  });

  it('passes a video with VideoObject in Microdata', () => {
    expect(
      verdict({ microdata: { types: ['VideoObject'], articleFields: [] } }),
    ).toEqual(PASSES);
  });

  it('passes a video declared through og:video', () => {
    expect(
      verdict({ openGraph: { 'og:video:url': 'https://a.example/v.mp4' } }),
    ).toEqual(PASSES);
  });

  it('fails an embed with nothing declared about it', () => {
    const result = verdict();
    expect(result).toEqual(failsWith({ count: 1 }));
    expect(evidenceOf(result)).toEqual([
      EMBED,
      'No VideoObject structured data and no og:video on the page',
    ]);
  });

  it('cannot be judged on a page with no video', () => {
    expect(verdict({ videos: [] })).toEqual(NOT_APPLICABLE);
  });
});
