/** What the first bytes of a file say it is, and how large, where the format says. */
export interface IImageHeader {
  /** `png`, `ico`, `gif`, `jpeg`, `bmp`, `tiff`, `ppm`, `webp`, `svg`, `avif`, `html`. */
  format: string;
  width: number | null;
  height: number | null;
}

const startsWith = (bytes: Uint8Array, ...prefix: number[]) =>
  prefix.every((byte, index) => bytes[index] === byte);

/**
 * ASCII at a byte offset, read from the bytes themselves: decoding first would let a
 * size field that happens to be valid UTF-8 fold into one character and shift the rest.
 */
const asciiAt = (bytes: Uint8Array, at: number, ascii: string) =>
  [...ascii].every((char, index) => bytes[at + index] === char.charCodeAt(0));

const u16be = (b: Uint8Array, at: number) => (b[at] << 8) | b[at + 1];
const u16le = (b: Uint8Array, at: number) => b[at] | (b[at + 1] << 8);
const u32be = (b: Uint8Array, at: number) =>
  ((b[at] << 24) >>> 0) + (b[at + 1] << 16) + (b[at + 2] << 8) + b[at + 3];
const i32le = (b: Uint8Array, at: number) =>
  b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24);

/** The size a JPEG's first start-of-frame marker declares, walking the segments to it. */
function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  let at = 2;
  while (at + 8 < b.length) {
    if (b[at] !== 0xff) return null;
    const marker = b[at + 1];
    // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC), which are not frames.
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    )
      return { height: u16be(b, at + 5), width: u16be(b, at + 7) };
    at += 2 + u16be(b, at + 2);
  }
  return null;
}

/**
 * A WebP's canvas size, from the first chunk after `RIFF····WEBP` (Google's WebP container
 * specification): VP8X carries it as two 24-bit values less one, a lossy VP8 frame as two
 * 14-bit values after its start code, a lossless VP8L as 14-bit values less one after its
 * signature byte. All within the first 30 bytes.
 */
function webpSize(b: Uint8Array): { width: number; height: number } | null {
  const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
  const u24le = (at: number) => b[at] | (b[at + 1] << 8) | (b[at + 2] << 16);
  if (chunk === 'VP8X' && b.length >= 30)
    return { width: u24le(24) + 1, height: u24le(27) + 1 };
  if (
    chunk === 'VP8 ' &&
    b.length >= 30 &&
    startsWith(b.subarray(23), 0x9d, 0x01, 0x2a)
  )
    return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  if (chunk === 'VP8L' && b.length >= 25 && b[20] === 0x2f)
    return {
      width: 1 + (b[21] | ((b[22] & 0x3f) << 8)),
      height: 1 + ((b[22] >> 6) | (b[23] << 2) | ((b[24] & 0x0f) << 10)),
    };
  return null;
}

/**
 * The format and pixel size of an image from its first bytes, read the way each format
 * lays out its header — never the extension, which is what a server misconfigures. Null
 * for bytes that are no format it knows. The size is null where the format puts it out
 * of reach of a header (TIFF, PPM, AVIF, SVG): only what is certain is said.
 */
export function readImageHeader(bytes: Uint8Array): IImageHeader | null {
  const b = bytes;
  if (startsWith(b, 0x89, 0x50, 0x4e, 0x47) && b.length >= 24)
    return { format: 'png', width: u32be(b, 16), height: u32be(b, 20) };
  if (startsWith(b, 0x00, 0x00, 0x01, 0x00) && b.length >= 6) {
    // An ICO holds several images; Google picks the one it needs, so the largest
    // stands for the file. A width or height byte of 0 means 256.
    let width = 0;
    let height = 0;
    for (let i = 0; i < u16le(b, 4) && 6 + i * 16 + 1 < b.length; i += 1) {
      const w = b[6 + i * 16] || 256;
      const h = b[6 + i * 16 + 1] || 256;
      if (w * h > width * height) [width, height] = [w, h];
    }
    return { format: 'ico', width: width || null, height: height || null };
  }
  if (startsWith(b, 0x47, 0x49, 0x46, 0x38) && b.length >= 10)
    return { format: 'gif', width: u16le(b, 6), height: u16le(b, 8) };
  if (startsWith(b, 0x42, 0x4d) && b.length >= 26)
    return {
      format: 'bmp',
      width: Math.abs(i32le(b, 18)),
      height: Math.abs(i32le(b, 22)),
    };
  if (startsWith(b, 0xff, 0xd8)) {
    const size = jpegSize(b);
    return {
      format: 'jpeg',
      width: size?.width ?? null,
      height: size?.height ?? null,
    };
  }
  if (
    startsWith(b, 0x49, 0x49, 0x2a, 0x00) ||
    startsWith(b, 0x4d, 0x4d, 0x00, 0x2a)
  )
    return { format: 'tiff', width: null, height: null };
  if (b[0] === 0x50 && b[1] >= 0x31 && b[1] <= 0x36)
    return { format: 'ppm', width: null, height: null };
  if (asciiAt(b, 0, 'RIFF') && asciiAt(b, 8, 'WEBP')) {
    const size = webpSize(b);
    return {
      format: 'webp',
      width: size?.width ?? null,
      height: size?.height ?? null,
    };
  }
  if (asciiAt(b, 4, 'ftypavi'))
    return { format: 'avif', width: null, height: null };
  const text = new TextDecoder()
    .decode(b.slice(0, 512))
    .trimStart()
    .toLowerCase();
  // Illustrator and Inkscape exports may declare the SVG doctype before the root.
  if (
    /^(?:<\?xml[^>]*>\s*)?(?:(?:<!--[\s\S]*?-->|<!doctype svg[^>]*>)\s*)*<svg/.test(
      text,
    )
  )
    return { format: 'svg', width: null, height: null };
  if (/^<!doctype html|^<html|^<head|^<body/.test(text))
    return { format: 'html', width: null, height: null };
  return null;
}
