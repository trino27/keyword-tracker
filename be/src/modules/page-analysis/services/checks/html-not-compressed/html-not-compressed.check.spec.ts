import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { HTML_NOT_COMPRESSED_CHECK } from './html-not-compressed.check';

const answeredWith = (headers: Record<string, string>) =>
  makeCheckInput({ headers: { 'content-type': 'text/html', ...headers } });

describe('HTML_NOT_COMPRESSED', () => {
  it.each(['br', 'gzip', 'deflate', 'GZIP'])('passes %s', (encoding) => {
    expect(
      HTML_NOT_COMPRESSED_CHECK.evaluate(
        answeredWith({ 'content-encoding': encoding }),
      ),
    ).toEqual(PASSES);
  });

  it('fails an answer with no Content-Encoding, quoting both sides', () => {
    const verdict = HTML_NOT_COMPRESSED_CHECK.evaluate(answeredWith({}));

    expect(verdict).toEqual(failsWith({ encoding: null }));
    expect(evidenceOf(verdict)).toEqual([
      'Request: Accept-Encoding: gzip, deflate, br',
      'Response: no Content-Encoding header',
    ]);
  });

  it('fails identity, which is the absence of compression said out loud', () => {
    expect(
      HTML_NOT_COMPRESSED_CHECK.evaluate(
        answeredWith({ 'content-encoding': 'identity' }),
      ),
    ).toEqual(failsWith({ encoding: 'identity' }));
  });
});
