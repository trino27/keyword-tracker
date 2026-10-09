import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeRunInput, runPage } from '../_testing/make-run-input';
import { NEAR_DUPLICATE_CONTENT_CHECK } from './near-duplicate-content.check';

/** Twenty-nine words no other sentence uses — prose with nothing repeated by chance. */
const filler = (prefix: string, n: number) =>
  Array.from({ length: 29 }, (_, k) => `${prefix}${n}w${k}`).join(' ');

/**
 * A doorway in miniature: one 300-word service page with the city swapped, the city
 * named once per sentence, ten times. The shape Google's spam policies describe, and
 * the case the 0.6 line was set for — it shares about 0.7.
 */
const servicePage = (city: string) =>
  Array.from({ length: 10 }, (_, n) => `${filler('repair', n)} ${city}.`);

/** Ten sentences of a separately written post on another subject. */
const essay = (topic: string) =>
  Array.from({ length: 10 }, (_, n) => `${filler(topic, n)} ${topic}.`);

const withBlocks = (path: string, blocks: string[]) =>
  runPage(path, { parsed: { blocks } });

describe('NEAR_DUPLICATE_CONTENT', () => {
  it('fails pages that differ by a swapped city, naming each other', () => {
    const [first, second] = NEAR_DUPLICATE_CONTENT_CHECK.evaluate(
      makeRunInput([
        withBlocks('toronto', servicePage('Toronto')),
        withBlocks('ottawa', servicePage('Ottawa')),
      ]),
    );

    expect(first).toEqual(
      failsWith({ otherUrls: ['https://a.example/ottawa/'] }),
    );
    expect(second).toEqual(
      failsWith({ otherUrls: ['https://a.example/toronto/'] }),
    );
    expect(evidenceOf(first)[0]).toBe(
      "73% of the text's five-word sequences also appear on https://a.example/ottawa/",
    );
  });

  it('passes pages written separately', () => {
    expect(
      NEAR_DUPLICATE_CONTENT_CHECK.evaluate(
        makeRunInput([
          withBlocks('a', essay('gardening')),
          withBlocks('b', essay('bookkeeping')),
        ]),
      ),
    ).toEqual([PASSES, PASSES]);
  });

  it('cannot judge a page too short to compare, or a run of one', () => {
    expect(
      NEAR_DUPLICATE_CONTENT_CHECK.evaluate(
        makeRunInput([
          withBlocks('a', ['Short.']),
          withBlocks('b', servicePage('Ottawa')),
        ]),
      )[0],
    ).toEqual(NOT_APPLICABLE);
    expect(
      NEAR_DUPLICATE_CONTENT_CHECK.evaluate(
        makeRunInput([withBlocks('a', servicePage('Ottawa'))]),
      ),
    ).toEqual([NOT_APPLICABLE]);
  });
});
