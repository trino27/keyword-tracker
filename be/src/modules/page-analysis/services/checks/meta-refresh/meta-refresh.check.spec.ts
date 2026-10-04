import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { META_REFRESH_CHECK } from './meta-refresh.check';

const withRefresh = (metaRefresh: string | null) =>
  makeCheckInput({ parsed: { metaRefresh } });

describe('META_REFRESH', () => {
  it('passes a page with no refresh tag', () => {
    expect(META_REFRESH_CHECK.evaluate(withRefresh(null))).toEqual(PASSES);
  });

  it.each([
    ['0; url=/elsewhere/', '/elsewhere/'],
    ['5;URL=https://b.example/', 'https://b.example/'],
    ["0; url='/quoted/'", '/quoted/'],
  ])('reports the target of %j', (content, to) => {
    expect(META_REFRESH_CHECK.evaluate(withRefresh(content))).toEqual(
      failsWith({ content, to }),
    );
  });

  // A refresh with no target re-requests the same page. It may be a poor idea; it is not
  // the redirect this check is about, and reporting it as one would be a false statement.
  it('passes a refresh that names no target', () => {
    expect(META_REFRESH_CHECK.evaluate(withRefresh('30'))).toEqual(PASSES);
  });
});
