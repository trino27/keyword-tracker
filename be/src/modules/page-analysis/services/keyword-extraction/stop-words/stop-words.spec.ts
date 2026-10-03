import { stopWordsFor } from './stop-words';

describe('stopWordsFor', () => {
  it('maps a BCP 47 tag to its list by the primary subtag', () => {
    expect(stopWordsFor('en-GB')?.has('the')).toBe(true);
    expect(stopWordsFor('de')?.has('und')).toBe(true);
  });

  it('adds the English supplement to English only', () => {
    expect(stopWordsFor('en')?.has('why')).toBe(true);
    expect(stopWordsFor('de')?.has('why')).toBe(false);
  });

  it('is null for an unknown or missing language', () => {
    expect(stopWordsFor('xx')).toBeNull();
    expect(stopWordsFor(null)).toBeNull();
  });
});
