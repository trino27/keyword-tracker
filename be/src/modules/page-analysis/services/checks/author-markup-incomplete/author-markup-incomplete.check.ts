import type { IMarkupAuthor } from '../../../interfaces/parsed-page.interface';
import { evidence } from '../_shared/evidence';
import { sameSite } from '../_shared/same-site';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The author types Google's Article guidance asks for: Person, or Organization and the
 * schema.org types beneath it a publisher realistically uses.
 */
const isAcceptedType = (type: string) =>
  type === 'Person' ||
  /Organization$/.test(type) ||
  ['Corporation', 'NGO', 'LocalBusiness'].includes(type);

/** "By Jane Doe", "Posted by Jane", "Автор: Иван" — words Google asks to leave out. */
const PREFIX = /^(?:by|posted\s+by|written\s+by|author\s*:?|автор\s*:?)\s+/i;

/** "Dr. Peter J. Meyers": Google lists an "Honorific prefix or suffix" among what to leave out. */
const HONORIFIC = /^(?:dr|mr|mrs|ms|mx|prof|sir|dame)\.?\s/i;

/**
 * A Person's name that reads as several people or carries a title: "Jane Doe and John
 * Roe", "Jane Doe, PhD". Only a Person's: "Smith & Partners" is an organization's name.
 */
const SEVERAL = /\s(?:and|&|и)\s|[,;/]/i;

/**
 * The publisher written into the name: "Dana @ Minimalist Baker" on minimalistbaker.com
 * (2026-10), "Jane | Acme". Google asks for the publisher in `publisher`, not here.
 */
const PUBLISHER = /\s[@|]\s/;

/**
 * A url naming the home page of the site the article is on: it says where the author
 * writes, not who they are. Another site's home page — a person's own site — does
 * identify them, as Google's "a web page that uniquely identifies the author" asks.
 */
function isOwnHomePage(url: string, pageUrl: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/' && !parsed.search && sameSite(url, pageUrl);
  } catch {
    return false;
  }
}

function problemsOf(author: IMarkupAuthor, pageUrl: string): string[] {
  const name = author.name ? `author "${author.name}"` : 'author with no name';
  if (author.asText)
    return [`${name} — a bare string, with no @type and no url to read more`];
  const problems: string[] = [];
  if (!author.type) problems.push('no @type');
  else if (!isAcceptedType(author.type))
    problems.push(`@type ${author.type}, not Person or Organization`);
  // Every address a home page: a WordPress profile's "website" field is often the site
  // itself, and on yoast.com it opens a sameAs list whose later entries do name the
  // author — so one home page among them is no finding, all of them is.
  if (author.urls.length === 0) problems.push('no url or sameAs');
  // An organization's home page is the page that identifies it.
  else if (
    author.type === 'Person' &&
    author.urls.every((url) => isOwnHomePage(url, pageUrl))
  )
    problems.push(
      `url ${author.urls[0]} is a home page, not a page about the author`,
    );
  if (!author.name) problems.push('no name');
  else if (PREFIX.test(author.name)) problems.push('a prefix in name');
  else if (HONORIFIC.test(author.name)) problems.push('an honorific in name');
  else if (PUBLISHER.test(author.name))
    problems.push('the publisher written into name');
  else if (author.type === 'Person' && SEVERAL.test(author.name))
    problems.push('name reads as several people or carries a title');
  return problems.length === 0 ? [] : [`${name} — ${problems.join(', ')}`];
}

/**
 * The article's authors as its markup states them, against Google's author best
 * practices: a type, a url, only the name, one entry per person. Not applicable when the
 * article markup names no author — AUTHOR_MISSING and STRUCTURED_DATA_INCOMPLETE speak
 * to that.
 */
export const AUTHOR_MARKUP_INCOMPLETE_CHECK = defineCheck(
  'AUTHOR_MARKUP_INCOMPLETE',
  ({ parsed, finalUrl }) => {
    const authors = parsed.articleMarkup?.authors ?? [];
    // Nothing on the page names the author: AUTHOR_MISSING's finding, which a nameless
    // Person in the markup (habr.com, 2026-10) would otherwise report a second time.
    if (authors.length === 0 || parsed.authors.length === 0)
      return NOT_APPLICABLE;
    // One author written twice — shopify.com names each twice in one node (2026-10) —
    // is one author, and one finding about them.
    const unique = [
      ...new Map(
        authors.map((author) => [JSON.stringify(author), author]),
      ).values(),
    ];
    const problems = unique.flatMap((author) => problemsOf(author, finalUrl));
    return problems.length === 0
      ? PASS
      : fails({
          count: problems.length,
          total: unique.length,
          evidence: evidence(problems),
        });
  },
);
