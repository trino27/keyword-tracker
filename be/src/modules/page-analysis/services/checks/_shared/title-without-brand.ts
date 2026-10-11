import { siteKeyOf } from '@app/contracts';
import type { ICheckInput } from '../check.interface';

/**
 * The separator a site's name hangs off a title by: "Post | Acme", "Post – Acme". Spaced on
 * both sides, so a hyphenated word ("e-mail") is not split. The crawl's soft-404 test
 * splits a title the same way (`post-selection.service.ts`).
 */
const TITLE_SEPARATOR = /\s[|•·–—-]\s/;

const plain = (text: string) =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** The names the page gives its site: og:site_name, the WebSite names, the domain's label. */
function siteNamesOf({ parsed, finalUrl }: ICheckInput): Set<string> {
  let label: string | undefined;
  try {
    label = siteKeyOf(new URL(finalUrl).hostname).split('.')[0];
  } catch {
    label = undefined;
  }
  return new Set(
    [
      parsed.openGraph['og:site_name'],
      ...parsed.websiteNames.flatMap(({ name, alternateNames }) => [
        name,
        ...alternateNames,
      ]),
      label,
    ]
      .filter((name): name is string => Boolean(name))
      .map(plain)
      .filter(Boolean),
  );
}

/** The title's parts between separators: "Post | Acme" → ["Post", "Acme"]. */
export const titleSegments = (title: string): string[] =>
  title
    .split(TITLE_SEPARATOR)
    .map((segment) => segment.trim())
    .filter(Boolean);

/**
 * The parts of the title in which the post names itself, without the site's name. A part
 * the page names its site by goes from either end — "Acme | How to build links" as well
 * as "How to build links | Acme", and "Studio 2019 | Link building basics" loses
 * "Studio 2019" when og:site_name says so. With no such part, the last one goes, as a
 * site's name usually sits there — unless it holds no letter: "Best SEO tools – 2025"
 * keeps its year.
 */
export function titleWithoutBrand(title: string, page: ICheckInput): string[] {
  const segments = titleSegments(title);
  if (segments.length < 2) return segments;
  const names = siteNamesOf(page);
  const isName = (segment: string) => names.has(plain(segment));
  const kept = [...segments];
  while (kept.length > 1 && isName(kept[0])) kept.shift();
  while (kept.length > 1 && isName(kept[kept.length - 1])) kept.pop();
  if (kept.length < segments.length) return kept;
  return /\p{L}/u.test(kept[kept.length - 1]) ? kept.slice(0, -1) : kept;
}
