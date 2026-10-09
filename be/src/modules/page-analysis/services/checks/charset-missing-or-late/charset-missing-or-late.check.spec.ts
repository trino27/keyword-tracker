import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CHARSET_MISSING_OR_LATE_CHECK } from './charset-missing-or-late.check';

const answered = (contentType: string, charsetDeclarationEnd: number | null) =>
  makeCheckInput({
    headers: { 'content-type': contentType },
    parsed: { charsetDeclarationEnd },
  });

describe('CHARSET_MISSING_OR_LATE', () => {
  it('passes a charset in the Content-Type header, wherever the meta sits', () => {
    expect(
      CHARSET_MISSING_OR_LATE_CHECK.evaluate(
        answered('text/html; charset=UTF-8', null),
      ),
    ).toEqual(PASSES);
  });

  it('passes a <meta charset> within the first 1024 bytes', () => {
    expect(
      CHARSET_MISSING_OR_LATE_CHECK.evaluate(answered('text/html', 1024)),
    ).toEqual(PASSES);
  });

  it('fails a declaration that ends past byte 1024, saying where', () => {
    const verdict = CHARSET_MISSING_OR_LATE_CHECK.evaluate(
      answered('text/html', 4_210),
    );

    expect(verdict).toEqual(failsWith({ declarationEnd: 4_210 }));
    expect(evidenceOf(verdict)).toEqual([
      'Content-Type: text/html — no charset',
      '<meta charset> ends at byte 4,210, past the first 1024',
    ]);
  });

  it('fails a page that declares no encoding anywhere', () => {
    expect(
      evidenceOf(
        CHARSET_MISSING_OR_LATE_CHECK.evaluate(answered('text/html', null)),
      ),
    ).toContain('No <meta charset> anywhere in the HTML');
  });
});
