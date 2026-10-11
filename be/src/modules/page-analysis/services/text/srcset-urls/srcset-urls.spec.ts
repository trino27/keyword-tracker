import { srcsetUrls } from './srcset-urls';

describe('srcsetUrls', () => {
  it('reads each candidate URL, without its descriptor', () => {
    expect(srcsetUrls('a.png 1x, b.png 2x')).toEqual(['a.png', 'b.png']);
    expect(srcsetUrls('a-400.jpg 400w,a-800.jpg 800w')).toEqual([
      'a-400.jpg',
      'a-800.jpg',
    ]);
  });

  it('keeps a comma inside a URL', () => {
    expect(
      srcsetUrls(
        'https://res.cloudinary.com/x/upload/w_400,h_300/IMG_1234.jpg 400w, https://res.cloudinary.com/x/upload/w_800,h_600/IMG_1234.jpg 800w',
      ),
    ).toEqual([
      'https://res.cloudinary.com/x/upload/w_400,h_300/IMG_1234.jpg',
      'https://res.cloudinary.com/x/upload/w_800,h_600/IMG_1234.jpg',
    ]);
  });

  it('ends a candidate at the commas a URL ends in', () => {
    expect(srcsetUrls('a.png,b.png')).toEqual(['a.png,b.png']);
    expect(srcsetUrls('a.png, b.png')).toEqual(['a.png', 'b.png']);
    expect(srcsetUrls('a.png,, b.png 2x')).toEqual(['a.png', 'b.png']);
  });

  it('reads nothing from nothing', () => {
    expect(srcsetUrls(null)).toEqual([]);
    expect(srcsetUrls(' , ')).toEqual([]);
  });
});
