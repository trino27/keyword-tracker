import { makeRuleInput } from '../../_testing/make-rule-input';
import { KEYWORD_RULES } from './keyword-rules';

const check = (title: string | null, topKeyword: string | null) =>
  KEYWORD_RULES.KEYWORD_NOT_IN_TITLE(
    makeRuleInput({ topKeyword, parsed: { title } }),
  );

describe('KEYWORD_RULES.KEYWORD_NOT_IN_TITLE', () => {
  it('passes when the title contains the keyword as whole words, any case or punctuation', () => {
    expect(check('Link-Building: a guide', 'link building')).toBeNull();
  });

  it('fires when the keyword is absent or only part of a word', () => {
    expect(check('A guide to outreach', 'link building')).toEqual({
      keyword: 'link building',
      title: 'A guide to outreach',
    });
    expect(check('Seasonal ideas', 'season')).toEqual({
      keyword: 'season',
      title: 'Seasonal ideas',
    });
  });

  it('stays silent without a title or a keyword', () => {
    expect(check(null, 'link building')).toBeNull();
    expect(check('A title', null)).toBeNull();
  });
});
