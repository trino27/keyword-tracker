import { readImageHeader } from './image-header';

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe('readImageHeader', () => {
  it('reads a PNG size from its IHDR chunk', () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    png.set([0, 0, 0x04, 0xb0, 0, 0, 0x02, 0x74], 16); // 1200 × 628
    expect(readImageHeader(png)).toEqual({
      format: 'png',
      width: 1200,
      height: 628,
    });
  });

  it('reads the largest image of an ICO, a 0 byte meaning 256', () => {
    const ico = bytes(
      ...[0, 0, 1, 0, 2, 0],
      ...[16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ...[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    );
    expect(readImageHeader(ico)).toEqual({
      format: 'ico',
      width: 256,
      height: 256,
    });
  });

  it('reads a GIF size', () => {
    expect(
      readImageHeader(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 32, 0, 16, 0)),
    ).toEqual({ format: 'gif', width: 32, height: 16 });
  });

  it('walks a JPEG to its start-of-frame marker', () => {
    const jpeg = bytes(
      ...[0xff, 0xd8],
      // APP0, 16 bytes long
      ...[0xff, 0xe0, 0x00, 0x10, ...new Array<number>(14).fill(0)],
      // SOF0: length, precision, height 683, width 1024
      ...[0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0xab, 0x04, 0x00],
    );
    expect(readImageHeader(jpeg)).toEqual({
      format: 'jpeg',
      width: 1024,
      height: 683,
    });
  });

  it.each([
    ['RIFF\u0000\u0000\u0000\u0000WEBPVP8 ', 'webp'],
    ['<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg">', 'svg'],
    ['<!DOCTYPE html><html><body>Not found', 'html'],
    [
      '<?xml version="1.0"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg>',
      'svg',
    ],
  ])('names the format of %j', (head, format) => {
    expect(readImageHeader(text(head))).toEqual({
      format,
      width: null,
      height: null,
    });
  });

  it('names a WebP whose size bytes read as UTF-8', () => {
    // C3 A9 is "é" in UTF-8: decoded first, the size would fold into one character.
    const webp = Uint8Array.from([
      ...[0x52, 0x49, 0x46, 0x46, 0xc3, 0xa9, 0x01, 0x00],
      ...[0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20],
    ]);
    expect(readImageHeader(webp)?.format).toBe('webp');
  });

  it('names an AVIF by its ftyp brand', () => {
    const avif = Uint8Array.from([
      ...[0x00, 0x00, 0x00, 0x20],
      ...[...'ftypavif'].map((char) => char.charCodeAt(0)),
    ]);
    expect(readImageHeader(avif)).toEqual({
      format: 'avif',
      width: null,
      height: null,
    });
  });

  /**
   * The first 30 bytes of Google's own WebP gallery samples, fetched 2026-10-11: lossy
   * gallery/1.webp is 550×368, lossless and extended gallery3/1_webp_ll and _a 400×301.
   */
  it.each([
    [
      'lossy VP8',
      [
        82, 73, 70, 70, 104, 118, 0, 0, 87, 69, 66, 80, 86, 80, 56, 32, 92, 118,
        0, 0, 210, 190, 1, 157, 1, 42, 38, 2, 112, 1,
      ],
      550,
      368,
    ],
    [
      'lossless VP8L',
      [
        82, 73, 70, 70, 164, 63, 1, 0, 87, 69, 66, 80, 86, 80, 56, 76, 152, 63,
        1, 0, 47, 143, 1, 75, 16, 77, 72, 108, 219, 72,
      ],
      400,
      301,
    ],
    [
      'extended VP8X',
      [
        82, 73, 70, 70, 206, 70, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88, 10, 0, 0,
        0, 16, 0, 0, 0, 143, 1, 0, 44, 1, 0,
      ],
      400,
      301,
    ],
  ])('reads the size of a %s WebP', (_, bytes, width, height) => {
    expect(readImageHeader(new Uint8Array(bytes))).toEqual({
      format: 'webp',
      width,
      height,
    });
  });

  it('says nothing of bytes it does not know', () => {
    expect(readImageHeader(text('hello'))).toBeNull();
    expect(readImageHeader(new Uint8Array())).toBeNull();
  });
});
