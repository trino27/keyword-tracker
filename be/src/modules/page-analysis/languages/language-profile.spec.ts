import { ENGLISH } from './english/english';
import { profileFor } from './language-profile';

describe('profileFor', () => {
  it('maps a BCP 47 tag to its profile by the primary subtag', () => {
    expect(profileFor('en-GB')).toBe(ENGLISH);
    expect(profileFor('de')?.stopWords.has('und')).toBe(true);
  });

  it('adds the English supplement to English only', () => {
    expect(profileFor('en')?.stopWords.has('why')).toBe(true);
    expect(profileFor('de')?.stopWords.has('why')).toBe(false);
  });

  it('gives clause verbs ONLY to a language that has a written profile', () => {
    // The point of the split: `test`, `plan` and `post` are English verbs and
    // ordinary words elsewhere, so no list is better than the wrong list.
    expect(profileFor('en')?.clauseVerbs.has('test')).toBe(true);
    expect(profileFor('de')?.clauseVerbs.size).toBe(0);
    expect(profileFor('bg')?.clauseVerbs.size).toBe(0);
  });

  it('gives a word-list language the full phrase length', () => {
    expect(profileFor('bg')?.maxNgram).toBe(5);
  });

  it('is null for an unknown or missing language', () => {
    expect(profileFor('xx')).toBeNull();
    expect(profileFor(null)).toBeNull();
  });
});
