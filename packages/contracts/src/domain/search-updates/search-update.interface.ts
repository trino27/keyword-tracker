/**
 * What kind of ranking change Google announced. `core` and `spam` are named because a
 * reader acts on them differently — a core update re-weighs quality and relevance, a
 * spam update targets one kind of abuse — and everything else (a Discover or reviews
 * update) is `other`.
 */
export const SEARCH_UPDATE_KINDS = ['core', 'spam', 'other'] as const;
export type TSearchUpdateKind = (typeof SEARCH_UPDATE_KINDS)[number];

/** One ranking update as Google's Search Status Dashboard announced it. */
export interface ISearchUpdate {
  id: string;
  /** As Google titles it: "May 2026 core update". */
  title: string;
  kind: TSearchUpdateKind;
  /** ISO instants in UTC; `end` is null while the rollout is still running. */
  begin: string;
  end: string | null;
  /** The dashboard's page for this update. */
  url: string;
}

/**
 * The updates Google announced, newest first. `available: false` says the dashboard
 * could not be read, so an empty list is not mistaken for "no updates happened".
 */
export interface ISearchUpdatesResponse {
  updates: ISearchUpdate[];
  available: boolean;
}
