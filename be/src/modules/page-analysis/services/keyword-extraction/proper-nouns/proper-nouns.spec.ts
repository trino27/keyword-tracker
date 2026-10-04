import { properNounsOf } from './proper-nouns';

describe('properNounsOf', () => {
  it('reads a word the prose capitalises away from a sentence start', () => {
    const names = properNounsOf([
      'WordPress 5.0 introduces Gutenberg, a new editor.',
      'Whether your site works with Gutenberg is the question.',
    ]);

    expect(names.has('gutenberg')).toBe(true);
  });

  it('does not read the first word of a sentence as a name', () => {
    const names = properNounsOf([
      'Drinks are served all day. Drinks are included in the ticket.',
    ]);

    expect(names.has('drinks')).toBe(false);
  });

  it('does not read a common word said often as a name', () => {
    const names = properNounsOf([
      'We noticed the traffic fell, and then noticed it again.',
      'Nobody noticed the change at first.',
    ]);

    expect(names.has('noticed')).toBe(false);
  });

  it('needs the capitals to be how the page usually writes the word', () => {
    const names = properNounsOf([
      'The post opens a list with Blocks, then talks about blocks.',
      'The editor builds blocks, and more blocks after that.',
    ]);

    expect(names.has('blocks')).toBe(false);
  });

  it('reads an acronym the prose writes in capitals', () => {
    const names = properNounsOf([
      'Your page needs a canonical URL, and that URL must resolve.',
    ]);

    expect(names.has('url')).toBe(true);
  });
});
