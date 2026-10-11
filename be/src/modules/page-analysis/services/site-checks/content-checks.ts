import { evidence } from '../checks/_shared/evidence';
import {
  SITE_NOT_APPLICABLE,
  SITE_PASS,
  type IFetchedEntry,
  type TSiteCheck,
} from './site-check.interface';

/** An entry whose answer was read as HTML: a post, or a page skipped for what it held. */
const wasRead = (entry: IFetchedEntry) =>
  entry.status === 'crawled' ||
  (entry.status === 'skipped_listing' && entry.httpStatus === 200);

/**
 * Posts whose HTML is an empty shell that JavaScript fills. Google renders them; the
 * search crawlers of AI assistants do not, and read nothing. Said once for the site,
 * because rendering is the framework's choice, never one post's. Counts the structured
 * flag, never the skip reason's wording (plan D8).
 */
export const contentNeedsJavascript: TSiteCheck = (input) => {
  const read = input.fetched.filter(wasRead);
  if (read.length === 0) return SITE_NOT_APPLICABLE;
  const shells = read.filter((entry) => entry.clientRendered);
  return shells.length === 0
    ? SITE_PASS
    : {
        outcome: 'fails',
        details: {
          count: shells.length,
          sampled: read.length,
          evidence: evidence([
            `${shells.length} of the ${read.length} posts this crawl read render their content with JavaScript:`,
            ...shells.map(({ url }) => url),
          ]),
        },
      };
};
