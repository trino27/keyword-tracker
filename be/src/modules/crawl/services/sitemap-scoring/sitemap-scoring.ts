import { siteKeyOf } from '@app/contracts';
import {
  BLOG_PATH_SECTIONS,
  BLOG_SITEMAP_MIN_SCORE,
  FEED_SHARE_WEIGHT,
  NEGATIVE_NAME_SCORE,
  NEGATIVE_NAME_TOKENS,
  PATH_SHARE_WEIGHT,
  POSITIVE_NAME_TOKENS,
} from '../../constants/sitemap-scoring.constant';

/** A fetched `urlset`; `order` is its position in the discovery walk (index order). */
export interface ISitemapLeaf {
  url: string;
  urls: string[];
  order: number;
}

/** Numbered siblings (`post-sitemap.xml`, `post-sitemap2.xml`) read as one sitemap. */
export interface ISitemapGroup {
  key: string;
  sitemapUrls: string[];
  urls: string[];
  order: number;
}

export interface IGroupScore {
  group: ISitemapGroup;
  score: number;
  nameScore: number;
  nameTerms: string[];
  pathShareScore: number;
  pathSection: string | null;
  feedShareScore: number;
  feedMatches: number;
}

export type TBlogSelection =
  | { ok: true; winner: IGroupScore; reason: string }
  | { ok: false; best: IGroupScore | null };

/** `/post-sitemap2.xml` → `/post-sitemap.xml`: digits right before the extension go. */
export function groupKeyOf(sitemapUrl: string): string {
  const url = new URL(sitemapUrl);
  const path = url.pathname.replace(
    /(\d+)(\.[a-z]+(?:\.gz)?)?(\/?)$/i,
    (_match, _digits, extension: string | undefined, slash: string) =>
      `${extension ?? ''}${slash}`,
  );
  return `${url.host}${path}`;
}

export function groupSitemaps(leaves: ISitemapLeaf[]): ISitemapGroup[] {
  const groups = new Map<string, ISitemapGroup>();
  for (const leaf of [...leaves].sort((a, b) => a.order - b.order)) {
    const key = groupKeyOf(leaf.url);
    const group = groups.get(key);
    if (group) {
      group.sitemapUrls.push(leaf.url);
      group.urls.push(...leaf.urls);
    } else {
      groups.set(key, {
        key,
        sitemapUrls: [leaf.url],
        urls: [...leaf.urls],
        order: leaf.order,
      });
    }
  }
  return [...groups.values()];
}

/** The name score of a sitemap URL's path — also how the walk orders its fetches. */
export function nameScoreOf(sitemapUrl: string): {
  score: number;
  terms: string[];
} {
  const tokens = new URL(sitemapUrl).pathname
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const positive = tokens
    .filter((token) => token in POSITIVE_NAME_TOKENS)
    .sort((a, b) => POSITIVE_NAME_TOKENS[b] - POSITIVE_NAME_TOKENS[a])[0];
  const negative = tokens.find((token) => NEGATIVE_NAME_TOKENS.has(token));
  const terms: string[] = [];
  let score = 0;
  if (positive) {
    score += POSITIVE_NAME_TOKENS[positive];
    terms.push(`"${positive}" +${POSITIVE_NAME_TOKENS[positive]}`);
  }
  if (negative) {
    score += NEGATIVE_NAME_SCORE;
    terms.push(`"${negative}" ${NEGATIVE_NAME_SCORE}`);
  }
  return { score, terms };
}

/** Same page regardless of scheme, `www.`, trailing slash or fragment. */
export function pageKeyOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${siteKeyOf(parsed.hostname)}${path}${parsed.search}`;
  } catch {
    return null;
  }
}

export function scoreGroup(
  group: ISitemapGroup,
  feedKeys: ReadonlySet<string>,
): IGroupScore {
  const name = nameScoreOf(group.sitemapUrls[0]);

  const sectionCounts = new Map<string, number>();
  for (const url of group.urls) {
    const section = firstSegmentOf(url);
    if (section && BLOG_PATH_SECTIONS.has(section))
      sectionCounts.set(section, (sectionCounts.get(section) ?? 0) + 1);
  }
  const [pathSection, sectionCount] = [...sectionCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0] ?? [null, 0];
  const pathShareScore =
    group.urls.length === 0
      ? 0
      : (PATH_SHARE_WEIGHT * sectionCount) / group.urls.length;

  const groupKeys = new Set(group.urls.map(pageKeyOf));
  const feedMatches = [...feedKeys].filter((key) => groupKeys.has(key)).length;
  const feedShareScore =
    feedKeys.size === 0 ? 0 : (FEED_SHARE_WEIGHT * feedMatches) / feedKeys.size;

  return {
    group,
    score: name.score + pathShareScore + feedShareScore,
    nameScore: name.score,
    nameTerms: name.terms,
    pathShareScore,
    pathSection,
    feedShareScore,
    feedMatches,
  };
}

/** Highest score, then more URLs, then index order; below the threshold, nothing. */
export function selectBlogGroup(
  groups: ISitemapGroup[],
  feedKeys: ReadonlySet<string>,
): TBlogSelection {
  const ranked = groups
    .map((group) => scoreGroup(group, feedKeys))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.group.urls.length - a.group.urls.length ||
        a.group.order - b.group.order,
    );
  const best = ranked[0] ?? null;
  if (!best || best.score < BLOG_SITEMAP_MIN_SCORE) return { ok: false, best };
  return { ok: true, winner: best, reason: describe(best, feedKeys.size) };
}

function firstSegmentOf(url: string): string | null {
  try {
    return (
      new URL(url).pathname.split('/').filter(Boolean)[0]?.toLowerCase() ?? null
    );
  } catch {
    return null;
  }
}

const formatScore = (value: number) => Number(value.toFixed(2)).toString();

function describe(score: IGroupScore, feedSize: number): string {
  const { group } = score;
  const sitemaps =
    group.sitemapUrls.length === 1
      ? group.sitemapUrls[0]
      : `${group.sitemapUrls[0]} (+${group.sitemapUrls.length - 1} numbered siblings)`;
  const name = score.nameTerms.length ? score.nameTerms.join(', ') : 'none';
  const path = score.pathSection
    ? `${formatScore(score.pathShareScore)} (under /${score.pathSection}/)`
    : '0';
  const feed =
    feedSize === 0
      ? '0 (no feed)'
      : `${formatScore(score.feedShareScore)} (${score.feedMatches} of ${feedSize} feed items)`;
  return `Selected ${sitemaps} with score ${formatScore(score.score)}: name ${name}; path share ${path}; feed share ${feed}.`;
}
