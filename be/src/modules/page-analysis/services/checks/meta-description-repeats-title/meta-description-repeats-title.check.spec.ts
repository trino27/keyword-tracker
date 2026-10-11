import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { META_DESCRIPTION_REPEATS_TITLE_CHECK } from './meta-description-repeats-title.check';

const page = (title: string | null, metaDescription: string | null) =>
  makeCheckInput({ parsed: { title, metaDescription } });

describe('META_DESCRIPTION_REPEATS_TITLE', () => {
  it('fails a description equal to the title without its brand suffix', () => {
    expect(
      META_DESCRIPTION_REPEATS_TITLE_CHECK.evaluate(
        page('How to Build Links | Acme Blog', 'How to build links.'),
      ),
    ).toEqual(failsWith({ description: 'How to build links.' }));
  });

  it('fails a description equal to the whole title', () => {
    expect(
      META_DESCRIPTION_REPEATS_TITLE_CHECK.evaluate(
        page('Link building – Acme', 'Link building — Acme'),
      ),
    ).toEqual(failsWith({ title: 'Link building – Acme' }));
  });

  it('passes a description that adds words', () => {
    expect(
      META_DESCRIPTION_REPEATS_TITLE_CHECK.evaluate(
        page(
          'How to Build Links | Acme Blog',
          'How to build links that last: five methods and what each costs.',
        ),
      ),
    ).toEqual(PASSES);
  });

  it('is not applicable without a description', () => {
    expect(
      META_DESCRIPTION_REPEATS_TITLE_CHECK.evaluate(page('A title', null)),
    ).toEqual(NOT_APPLICABLE);
  });

  it('is not applicable without a title', () => {
    expect(
      META_DESCRIPTION_REPEATS_TITLE_CHECK.evaluate(
        page(null, 'A description'),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
