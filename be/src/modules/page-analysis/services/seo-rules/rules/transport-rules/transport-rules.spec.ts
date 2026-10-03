import { makeRuleInput } from '../../_testing/make-rule-input';
import { TRANSPORT_RULES } from './transport-rules';

describe('TRANSPORT_RULES', () => {
  it('NOT_HTTPS judges where the request ended', () => {
    expect(
      TRANSPORT_RULES.NOT_HTTPS(
        makeRuleInput({ finalUrl: 'http://a.example/post/' }),
      ),
    ).toEqual({ url: 'http://a.example/post/' });
    expect(TRANSPORT_RULES.NOT_HTTPS(makeRuleInput())).toBeNull();
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
    ).toEqual({ from: 'https://a.example/old/', to: 'https://a.example/new/' });
    expect(TRANSPORT_RULES.REDIRECTED(makeRuleInput())).toBeNull();
  });

  it.each([
    [1_500, null],
    [1_501, { ttfbMs: 1_501, max: 1_500 }],
  ])('SLOW_RESPONSE at %d ms', (responseMs, expected) => {
    expect(
      TRANSPORT_RULES.SLOW_RESPONSE(makeRuleInput({ responseMs })),
    ).toEqual(expected);
  });

  it.each([
    [1_048_576, null],
    [1_048_577, { bytes: 1_048_577, max: 1_048_576 }],
  ])('LARGE_PAGE at %d bytes', (htmlBytes, expected) => {
    expect(TRANSPORT_RULES.LARGE_PAGE(makeRuleInput({ htmlBytes }))).toEqual(
      expected,
    );
  });
});
