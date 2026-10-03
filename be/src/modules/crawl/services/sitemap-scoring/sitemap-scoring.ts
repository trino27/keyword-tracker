import { siteKeyOf } from '@app/contracts';
import {
  BLOG_HOST_LABELS,
  BLOG_HOST_NAME_SCORE,
  BLOG_PATH_SECTIONS,
  BLOG_SITEMAP_MIN_SCORE,
  FEED_SHARE_WEIGHT,
  NEGATIVE_NAME_SCORE,
  NEGATIVE_NAME_TOKENS,
  NEWS_SITEMAP_SCORE,
  PATH_SHARE_WEIGHT,
  POSITIVE_NAME_TOKENS,
} from '../../constants/sitemap-scoring.constant';

/** A fetched `urlset`; `order` is its position in the discovery walk (index order). */
export interface ISitemapLeaf {
  url: string;
  urls: string[];
  order: number;
  /** A Google News sitemap. */
  news?: boolean;
}

/** Numbered siblings (`post-sitemap.xml`, `post-sitemap2.xml`) read as one sitemap. */
export interface ISitemapGroup {
  key: string;
  sitemapUrls: string[];
  urls: string[];
  order: number;
  news: boolean;
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

/**
 * `confirmed`: the winner scored as a blog. Unconfirmed, it is only the least unlikely
 * sitemap — the crawl then counts a page as a post only when the page says it is an
 * article.
 */
export type TBlogSelection =
  | { ok: true; confirmed: boolean; winner: IGroupScore; reason: string }
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
      group.news ||= leaf.news === true;
    } else {
      groups.set(key, {
        key,
        sitemapUrls: [leaf.url],
        urls: [...leaf.urls],
        order: leaf.order,
        news: leaf.news === true,
      });
    }
  }
  return [...groups.values()];
}

/** The name score of a sitemap URL's path — also how the walk orders its fetches. */
export function nameScoreOf(
  sitemapUrl: string,
  siteKey?: string,
): {
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
  const hostLabel = siteKey?.split('.')[0];
  const hostIsBlog = hostLabel !== undefined && BLOG_HOST_LABELS.has(hostLabel);

  const terms: string[] = [];
  let score = 0;
  const pathScore = positive ? POSITIVE_NAME_TOKENS[positive] : 0;
  if (hostIsBlog && BLOG_HOST_NAME_SCORE >= pathScore) {
    score += BLOG_HOST_NAME_SCORE;
    terms.push(`host "${hostLabel}." +${BLOG_HOST_NAME_SCORE}`);
  } else if (positive) {
    score += pathScore;
    terms.push(`"${positive}" +${pathScore}`);
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
  siteKey?: string,
): IGroupScore {
  const name = nameScoreOf(group.sitemapUrls[0], siteKey);
  if (group.news) {
    name.score += NEWS_SITEMAP_SCORE;
    name.terms.push(`news sitemap +${NEWS_SITEMAP_SCORE}`);
  }

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

/**
 * Highest score, then more URLs, then index order. At or above the threshold the winner
 * is a confirmed blog; below it, the best group that is not marked as something else
 * (score ≥ 0, with URLs) is returned unconfirmed; otherwise nothing.
 */
export function selectBlogGroup(
  groups: ISitemapGroup[],
  feedKeys: ReadonlySet<string>,
  siteKey?: string,
): TBlogSelection {
  const ranked = groups
    .filter((group) => group.urls.length > 0)
    .map((group) => scoreGroup(group, feedKeys, siteKey))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.group.urls.length - a.group.urls.length ||
        a.group.order - b.group.order,
    );
  const best = ranked[0] ?? null;
  if (!best || best.score < 0) return { ok: false, best };
  const confirmed = best.score >= BLOG_SITEMAP_MIN_SCORE;
  return {
    ok: true,
    confirmed,
    winner: best,
    reason: describe(best, feedKeys.size, confirmed),
  };
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

function describe(
  score: IGroupScore,
  feedSize: number,
  confirmed: boolean,
): string {
  const { group } = score;
  const siblings = group.sitemapUrls.length - 1;
  const sitemaps =
    siblings === 0
      ? group.sitemapUrls[0]
      : `${group.sitemapUrls[0]} (+${siblings} numbered sibling${siblings === 1 ? '' : 's'})`;
  const name = score.nameTerms.length ? score.nameTerms.join(', ') : 'none';
  const path = score.pathSection
    ? `${formatScore(score.pathShareScore)} (under /${score.pathSection}/)`
    : '0';
  const feed =
    feedSize === 0
      ? '0 (no feed)'
      : `${formatScore(score.feedShareScore)} (${score.feedMatches} of ${feedSize} feed items)`;
  const scored = `with score ${formatScore(score.score)}: name ${name}; path share ${path}; feed share ${feed}.`;
  return confirmed
    ? `Selected ${sitemaps} ${scored}`
    : `No sitemap looks like a blog; read ${sitemaps} ${scored} Only pages marked as articles count as posts.`;
}
