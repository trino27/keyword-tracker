import type { IPageImage } from '../../../interfaces/parsed-page.interface';
import { srcsetUrls } from '../../text/srcset-urls/srcset-urls';

/**
 * The file an image address names, decoded, without its directory, query or fragment —
 * `IMG_1234.JPG` from `https://a.example/wp-content/uploads/IMG_1234.JPG?w=800`. Null
 * for a `data:` URI or an address with no file name in it.
 *
 * An image optimizer serves the file from an endpoint with no extension and names it in
 * a `url` parameter — Next.js's `/_next/image?url=%2Fuploads%2Fhero.png&w=1080`, on
 * vercel.com and backlinko.com — so there the file is the parameter's, not "image".
 */
export function fileNameOf(url: string): string | null {
  if (/^\s*data:/i.test(url)) return null;
  const [path, query = ''] = url.split('#')[0].split('?');
  const proxied = new URLSearchParams(query).get('url');
  if (!/\.[a-z0-9]{2,5}$/i.test(path) && proxied) return fileNameOf(proxied);
  const last = path.split('/').pop() ?? '';
  let name: string;
  try {
    name = decodeURIComponent(last);
  } catch {
    name = last;
  }
  return name.trim() || null;
}

/** The extension, lower-cased and without its dot; null when the name has none. */
export function extensionOf(fileName: string): string | null {
  const match = /\.([a-z0-9]{2,5})$/i.exec(fileName);
  return match ? match[1].toLowerCase() : null;
}

/**
 * The name without its extension or the size suffix a CMS adds to resized copies —
 * `IMG_1234-1024x768.jpg` → `IMG_1234` — so a copy is judged by the name its author gave.
 */
export const stemOf = (fileName: string) =>
  fileName.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/-\d+x\d+$/, '');

/**
 * The address an image is shown from, as the author wrote it: `src`, or else the first
 * `srcset` candidate. A `data:` placeholder in `src` defers to the srcset.
 */
export function shownUrlOf(image: IPageImage): string | null {
  const src = image.src?.trim();
  if (src && !/^data:/i.test(src)) return src;
  const [candidate] = srcsetUrls(image.srcset);
  return candidate || src || null;
}
