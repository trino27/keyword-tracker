import type { IParsedPage } from '../../interfaces/parsed-page.interface';
import type { ICandidateStats } from '../../services/keyword-extraction/collect-candidates/collect-candidates';
import type {
  IScoredCandidate,
  ISelectedKeyword,
} from '../../services/keyword-extraction/select-keywords/select-keywords';

/** One page of a run, as keyword extraction needs it. */
export interface IKeywordSource {
  url: string;
  parsed: IParsedPage;
}

/**
 * What the steps read and write, in the order they fill it.
 *
 * Every field after the run itself starts empty and is written by exactly one step; a
 * later step reads what an earlier one left. Keeping them on one object rather than
 * passing them along is what lets a step be inserted between two others without
 * rewriting either: the stemming step planned for inflected languages belongs between
 * `collect` and `frequency`, and neither has to know it arrived.
 */
export interface IKeywordContext {
  readonly pages: readonly IKeywordSource[];
  readonly siteKey: string;
  /** Title tail segments the RUN repeats — the brand, a section a CMS appends. */
  titleChrome: ReadonlySet<string>;
  /** Declared keywords the RUN repeats: the CMS taxonomy, not one page's subject. */
  taxonomyKeywords: ReadonlySet<string>;
  /** Per page, by the same index as `pages`. */
  candidates: Map<string, ICandidateStats>[];
  /** How many pages of the run each term appears on; the corpus penalty reads it. */
  documentFrequency: Map<string, number>;
  /** Per page: every candidate with its final score, unordered. */
  scored: IScoredCandidate[][];
  /** Per page: the answer. */
  keywords: ISelectedKeyword[][];
}

/**
 * One step of keyword extraction, named so a pipeline reads as its steps and a test can
 * replace one by name. A step is pure in everything but the context it fills.
 */
export interface IKeywordStep {
  readonly name: string;
  run(context: IKeywordContext): void;
}
