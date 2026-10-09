import { BFCACHE_BLOCKED_BY_NO_STORE_CHECK } from './bfcache-blocked-by-no-store/bfcache-blocked-by-no-store.check';
import { DOM_SIZE_LARGE_CHECK } from './dom-size-large/dom-size-large.check';
import { FONT_PRELOAD_WITHOUT_CROSSORIGIN_CHECK } from './font-preload-without-crossorigin/font-preload-without-crossorigin.check';
import { LCP_IMAGE_LAZY_LOADED_CHECK } from './lcp-image-lazy-loaded/lcp-image-lazy-loaded.check';
import { RENDER_BLOCKING_SCRIPTS_CHECK } from './render-blocking-scripts/render-blocking-scripts.check';
import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from './_testing/expect-verdict';
import { makeCheckInput } from './_testing/make-check-input';

describe('LCP_IMAGE_LAZY_LOADED', () => {
  it('fails a featured image loaded lazily, quoting it', () => {
    const markup = '<img src="/hero.jpg" loading="lazy">';
    const verdict = LCP_IMAGE_LAZY_LOADED_CHECK.evaluate(
      makeCheckInput({
        parsed: { featuredImage: { loading: 'lazy', markup } },
      }),
    );

    expect(verdict).toEqual(failsWith({}));
    expect(evidenceOf(verdict)).toEqual([
      `${markup} — the featured image, loaded lazily`,
    ]);
  });

  it('passes an eager one, and cannot judge a page with none', () => {
    expect(LCP_IMAGE_LAZY_LOADED_CHECK.evaluate(makeCheckInput())).toEqual(
      PASSES,
    );
    expect(
      LCP_IMAGE_LAZY_LOADED_CHECK.evaluate(
        makeCheckInput({ parsed: { featuredImage: null } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});

describe('RENDER_BLOCKING_SCRIPTS', () => {
  it('quotes each parser-blocking script', () => {
    const verdict = RENDER_BLOCKING_SCRIPTS_CHECK.evaluate(
      makeCheckInput({
        parsed: {
          renderBlockingScripts: ['<script src="/jquery.js"></script>'],
        },
      }),
    );

    expect(verdict).toEqual(failsWith({ count: 1 }));
    expect(evidenceOf(verdict)).toEqual(['<script src="/jquery.js"></script>']);
    expect(RENDER_BLOCKING_SCRIPTS_CHECK.evaluate(makeCheckInput())).toEqual(
      PASSES,
    );
  });
});

describe('FONT_PRELOAD_WITHOUT_CROSSORIGIN', () => {
  it('quotes each font preload missing crossorigin', () => {
    const link = '<link rel="preload" as="font" href="/f.woff2">';
    expect(
      evidenceOf(
        FONT_PRELOAD_WITHOUT_CROSSORIGIN_CHECK.evaluate(
          makeCheckInput({
            parsed: { fontPreloadsWithoutCrossorigin: [link] },
          }),
        ),
      ),
    ).toEqual([link]);
    expect(
      FONT_PRELOAD_WITHOUT_CROSSORIGIN_CHECK.evaluate(makeCheckInput()),
    ).toEqual(PASSES);
  });
});

describe('BFCACHE_BLOCKED_BY_NO_STORE', () => {
  it.each([
    ['no-store', true],
    ['private, no-store, max-age=0', true],
    ['no-cache', false],
    ['public, max-age=604800', false],
  ])('Cache-Control: %s → fails %s', (cacheControl, failing) => {
    const verdict = BFCACHE_BLOCKED_BY_NO_STORE_CHECK.evaluate(
      makeCheckInput({ headers: { 'cache-control': cacheControl } }),
    );

    expect(verdict).toEqual(failing ? failsWith({}) : PASSES);
  });
});

describe('DOM_SIZE_LARGE', () => {
  it('measures the elements against 1,400', () => {
    const verdict = DOM_SIZE_LARGE_CHECK.evaluate(
      makeCheckInput({ parsed: { elementCount: 2_487 } }),
    );

    expect(verdict).toEqual(failsWith({ value: 2_487, max: 1_400 }));
    expect(evidenceOf(verdict)).toEqual([
      '2,487 elements in the HTML as served',
    ]);
    expect(
      DOM_SIZE_LARGE_CHECK.evaluate(
        makeCheckInput({ parsed: { elementCount: 1_400 } }),
      ),
    ).toEqual(PASSES);
  });
});
