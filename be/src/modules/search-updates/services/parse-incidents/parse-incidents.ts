import type { ISearchUpdate, TSearchUpdateKind } from '@app/contracts';
import { SEARCH_STATUS_ORIGIN } from '../../constants/search-status.constant';

/**
 * The dashboard's service for ranking changes. It also reports crawling, indexing and
 * serving incidents — outages, not updates — and those say nothing about why a page's
 * position moved.
 */
const RANKING_SERVICE = 'Ranking';

const kindOf = (title: string): TSearchUpdateKind =>
  /\bcore update\b/i.test(title)
    ? 'core'
    : /\bspam update\b/i.test(title)
      ? 'spam'
      : 'other';

const isInstant = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

/**
 * The ranking updates in the dashboard's `incidents.json`, newest first. The feed is
 * someone else's and undocumented, so every field is checked and an entry missing one
 * is dropped rather than guessed at; a body that is not a list is no updates at all.
 */
export function parseIncidents(feed: unknown): ISearchUpdate[] {
  if (!Array.isArray(feed)) return [];
  const updates: ISearchUpdate[] = [];
  for (const entry of feed as unknown[]) {
    if (!entry || typeof entry !== 'object') continue;
    const incident = entry as Record<string, unknown>;
    if (incident.service_name !== RANKING_SERVICE) continue;
    const { id, external_desc: title, begin, end, uri } = incident;
    if (
      typeof id !== 'string' ||
      typeof title !== 'string' ||
      !isInstant(begin)
    )
      continue;
    updates.push({
      id,
      title: title.trim(),
      kind: kindOf(title),
      begin: new Date(begin).toISOString(),
      end: isInstant(end) ? new Date(end).toISOString() : null,
      url:
        typeof uri === 'string'
          ? new URL(uri, `${SEARCH_STATUS_ORIGIN}/`).href
          : SEARCH_STATUS_ORIGIN,
    });
  }
  return updates.sort((a, b) => b.begin.localeCompare(a.begin));
}
