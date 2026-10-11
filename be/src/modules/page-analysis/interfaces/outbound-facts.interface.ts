import type { IAlternateLink } from './parsed-page.interface';

/**
 * What one URL answered when the crawl asked for its status (plan D5). The redirect shape
 * is restated rather than imported: checks read this file, and checks may not reach
 * `@infrastructure/remote-api`, not even for a type (plan D28).
 */
export type TOutboundOutcome =
  | {
      kind: 'answered';
      status: number;
      redirects: readonly { url: string; status: number }[];
      finalUrl: string;
    }
  | {
      kind: 'failed';
      failure:
        | 'nxdomain'
        | 'timeout'
        | 'network'
        | 'forbiddenAddress'
        | 'tooManyRedirects';
    }
  | { kind: 'unchecked'; reason: 'budget' | 'deadline' | 'robots' };

/** What a page declares about itself that another page's check needs to know. */
export interface IDocumentPage {
  noindex: boolean;
  /** The first declared canonical, `<head>` before header; null when none. */
  canonical: string | null;
  alternates: readonly IAlternateLink[];
}

/** A page the crawl read whole: one of the run's own, or one fetched under the budget. */
export interface IDocumentFacts {
  url: string;
  outcome: TOutboundOutcome;
  /** Present only for a 200 HTML answer. */
  page: IDocumentPage | null;
}

/**
 * Everything the outbound stage learned, keyed by fragment-free URL: the status of each
 * content link, and what each canonical target and hreflang alternate declares.
 */
export interface IOutboundFacts {
  links: ReadonlyMap<string, TOutboundOutcome>;
  documents: ReadonlyMap<string, IDocumentFacts>;
}

/** Nothing learned: every check that reads the facts is then not applicable. */
export const NO_OUTBOUND_FACTS: IOutboundFacts = {
  links: new Map(),
  documents: new Map(),
};
