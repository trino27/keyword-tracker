import { failsWith, PASSES } from '../../_testing/expect-verdict';
import { makeRuleInput } from '../../_testing/make-rule-input';
import { TRANSPORT_RULES } from './transport-rules';

describe('TRANSPORT_RULES', () => {
  it('NOT_HTTPS judges where the request ended', () => {
    expect(
      TRANSPORT_RULES.NOT_HTTPS(
        makeRuleInput({ finalUrl: 'http://a.example/post/' }),
      ),
    ).toEqual(failsWith({ url: 'http://a.example/post/' }));
    expect(TRANSPORT_RULES.NOT_HTTPS(makeRuleInput())).toEqual(PASSES);
  });

  it('REDIRECTED reports both ends', () => {
    expect(
      TRANSPORT_RULES.REDIRECTED(
        makeRuleInput({
          url: 'https://a.example/old/',
          finalUrl: 'https://a.example/new/',
          redirected: true,
        }),
      ),
    ).toEqual(
      failsWith({
        from: 'https://a.example/old/',
        to: 'https://a.example/new/',
      }),
    );
    expect(TRANSPORT_RULES.REDIRECTED(makeRuleInput())).toEqual(PASSES);
  });

  it.each([
    [1_048_576, PASSES],
    [1_048_577, failsWith({ value: 1_048_577, max: 1_048_576 })],
  ])('LARGE_PAGE at %d bytes', (htmlBytes, expected) => {
    expect(TRANSPORT_RULES.LARGE_PAGE(makeRuleInput({ htmlBytes }))).toEqual(
      expected,
    );
  });
});
