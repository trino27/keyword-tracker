import { RUN_BOILERPLATE_SHARE } from '../../constants/keyword-scoring.constant';
import { profileFor } from '../../languages/language-profile';
import { runPipeline } from '../pipeline';
import { normalizeText } from '../../services/text/normalize-text/normalize-text';
import {
  collectCandidates,
  stripTitleChrome,
  namedClause,
  slugOf,
  titleSegments,
} from '../../services/keyword-extraction/collect-candidates/collect-candidates';
import {
  idfFactor,
  isAnchored,
  pageScore,
} from '../../services/keyword-extraction/score-candidates/score-candidates';
import {
  selectKeywords,
  subsume,
} from '../../services/keyword-extraction/select-keywords/select-keywords';
import type {
  IKeywordContext,
  IKeywordSource,
  IKeywordStep,
} from './keyword-step.interface';

/** Values this share of the run's pages repeat; never from a run of one page. */
function shared(counts: Map<string, number>, pageCount: number): Set<string> {
  const needed = Math.max(2, Math.ceil(pageCount * RUN_BOILERPLATE_SHARE));
  return new Set(
    [...counts].filter(([, seen]) => seen >= needed).map(([value]) => value),
  );
}

/**
 * Title tail segments most of the run repeats: the brand, and the section a CMS
 * appends to every headline. The first segment is never chrome — it is the page.
 */
function titleChromeOf(pages: readonly IKeywordSource[]): Set<string> {
  const counts = new Map<string, number>();
  for (const page of pages) {
    const segments = titleSegments(page.parsed.title ?? '').slice(1);
    for (const segment of new Set(segments.map(normalizeText))) {
      if (segment) counts.set(segment, (counts.get(segment) ?? 0) + 1);
    }
  }
  return shared(counts, pages.length);
}

/**
 * Declared keywords most of the run repeats. A page's own `keywords` are a real
 * signal — a Yoast focus keyphrase is the page's subject — but a news CMS puts its
 * rubric in the same field, and "International" or "Region National" on every story
 * would earn the declared bonus on every story.
 */
function taxonomyKeywordsOf(pages: readonly IKeywordSource[]): Set<string> {
  const counts = new Map<string, number>();
  for (const page of pages) {
    const declared = [
      ...page.parsed.jsonLd.keywords,
      ...page.parsed.articleTags,
    ].map(normalizeText);
    for (const keyword of new Set(declared)) {
      if (keyword) counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
    }
  }
  return shared(counts, pages.length);
}

/**
 * The normalized first clause of the page's own title — what it declares itself to be
 * about, with the site's chrome stripped and the slug consulted over which clause the
 * author meant. Read by scoring, which exempts it from the corroboration damping, and
 * by selection, which exempts it from subsumption; both need the same string, so it
 * is computed here once rather than derived twice from the same parts.
 */
function titleHeadOf(context: IKeywordContext, index: number): string {
  const { parsed } = context.pages[index];
  const { head } = namedClause(
    stripTitleChrome(
      parsed.title ?? '',
      context.siteKey,
      parsed.openGraph['og:site_name'],
      context.titleChrome,
    ),
    slugOf(context.pages[index].url),
  );
  return head ? normalizeText(head) : '';
}

/**
 * What the pages share, read before anything is scored: a site's chrome cannot be told
 * from a page's subject by looking at the page.
 */
export const RUN_BOILERPLATE_STEP: IKeywordStep = {
  name: 'run-boilerplate',
  run(context) {
    context.titleChrome = titleChromeOf(context.pages);
    context.taxonomyKeywords = taxonomyKeywordsOf(context.pages);
  },
};

/** Every phrase of every page that could be a keyword, with where it was read from. */
export const COLLECT_STEP: IKeywordStep = {
  name: 'collect',
  run(context) {
    context.candidates = context.pages.map((page) =>
      collectCandidates({
        url: page.url,
        parsed: page.parsed,
        siteKey: context.siteKey,
        titleChrome: context.titleChrome,
        taxonomyKeywords: context.taxonomyKeywords,
      }),
    );
  },
};

/** How many pages of the run carry each term — the corpus penalty's denominator. */
export const DOCUMENT_FREQUENCY_STEP: IKeywordStep = {
  name: 'document-frequency',
  run(context) {
    const documentFrequency = new Map<string, number>();
    for (const candidates of context.candidates) {
      for (const term of candidates.keys())
        documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
    context.documentFrequency = documentFrequency;
  },
};

/** The page's own score times what the rest of the run says about the term. */
export const SCORE_STEP: IKeywordStep = {
  name: 'score',
  run(context) {
    const pageCount = context.pages.length;
    context.scored = context.candidates.map((candidates, index) => {
      // Per PAGE, because a run may mix languages and the rules of one are not the
      // rules of another.
      const profile = profileFor(context.pages[index].parsed.lang);
      const titleHead = titleHeadOf(context, index);
      return [...candidates].map(([term, stats]) => {
        return {
          term,
          runs: stats.runs,
          properNoun: stats.properNoun,
          score:
            pageScore(stats, term, profile, titleHead) *
            idfFactor(
              pageCount,
              context.documentFrequency.get(term) ?? 1,
              isAnchored(stats),
            ),
        };
      });
    });
  },
};

/** Containment, overlap, the per-sentence limit, the budget and the floor. */
export const SELECT_STEP: IKeywordStep = {
  name: 'select',
  run(context) {
    context.keywords = context.scored.map((scored, index) => {
      const head = titleHeadOf(context, index);
      return selectKeywords(
        subsume(scored, head || undefined),
        context.pages[index].parsed.wordCount,
      );
    });
  },
};

/**
 * Keyword extraction, as the ordered list of what it does (§10.4).
 *
 * The order is the algorithm, and it is data: a step is inserted, replaced or dropped
 * by editing this array, and every step either leaves the context as it found it or
 * fills exactly one field of it. That is the point — the work this module has ahead of
 * it is experimental (a stemmer per language, a different corpus penalty, candidates
 * from somewhere other than the page), and an experiment that is one array entry is one
 * that can be run and reverted.
 */
export const KEYWORD_PIPELINE: readonly IKeywordStep[] = [
  RUN_BOILERPLATE_STEP,
  COLLECT_STEP,
  DOCUMENT_FREQUENCY_STEP,
  SCORE_STEP,
  SELECT_STEP,
];

/** A context no step has written to yet. */
export function emptyContext(
  pages: readonly IKeywordSource[],
  siteKey: string,
): IKeywordContext {
  return {
    pages,
    siteKey,
    titleChrome: new Set(),
    taxonomyKeywords: new Set(),
    candidates: [],
    documentFrequency: new Map(),
    scored: [],
    keywords: [],
  };
}

/** Runs the steps in order over one context and hands it back filled. */
export function runKeywordPipeline(
  context: IKeywordContext,
  pipeline: readonly IKeywordStep[] = KEYWORD_PIPELINE,
): Promise<IKeywordContext> {
  return runPipeline(context, pipeline);
}
