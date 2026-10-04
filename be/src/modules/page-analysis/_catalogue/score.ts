import { GOOD, JUNK } from './labels';
import type { IRunRow } from './harness';

export interface IArmScore {
  good: number;
  junk: number;
  unlabelled: number;
  total: number;
  /** Pages whose relevance-1.00 keyword is labelled GOOD. */
  primaryGood: number;
  pages: number;
  emptyPages: number;
  lines: string[];
  newTerms: string[];
}

const mark = (key: string, term: string): 'GOOD' | 'JUNK' | '?' => {
  if ((GOOD[key] ?? []).includes(term)) return 'GOOD';
  if ((JUNK[key] ?? []).includes(term)) return 'JUNK';
  return '?';
};

/**
 * Counts an arm against the hand labels and renders every page so the output can be
 * read rather than only totalled. An UNLABELLED term counts towards nothing: an arm
 * with many of them has not been judged yet, and `newTerms` lists them.
 */
export function score(rows: IRunRow[]): IArmScore {
  const out: IArmScore = {
    good: 0,
    junk: 0,
    unlabelled: 0,
    total: 0,
    primaryGood: 0,
    pages: rows.length,
    emptyPages: 0,
    lines: [],
    newTerms: [],
  };
  for (const row of rows) {
    const key = `${row.site}/${row.slug}`;
    if (row.keywords.length === 0) out.emptyPages += 1;
    const rendered: string[] = [];
    row.keywords.forEach((k, i) => {
      const m = mark(key, k.term);
      out.total += 1;
      if (m === 'GOOD') out.good += 1;
      else if (m === 'JUNK') out.junk += 1;
      else {
        out.unlabelled += 1;
        out.newTerms.push(`${key} :: ${k.term}`);
      }
      if (i === 0 && m === 'GOOD') out.primaryGood += 1;
      const flag = m === 'GOOD' ? '+' : m === 'JUNK' ? '-' : '?';
      rendered.push(`${flag}${k.term} [${k.relevance.toFixed(2)}]`);
    });
    out.lines.push(`${key.padEnd(62)} ${rendered.join(' | ') || '(none)'}`);
  }
  return out;
}

export function summary(name: string, s: IArmScore): string {
  const precision = s.total === 0 ? 0 : s.good / s.total;
  return [
    `${name.padEnd(30)}`,
    `good ${String(s.good).padStart(3)}`,
    `junk ${String(s.junk).padStart(3)}`,
    `new ${String(s.unlabelled).padStart(3)}`,
    `total ${String(s.total).padStart(3)}`,
    `precision ${(precision * 100).toFixed(1).padStart(5)}%`,
    `primary ${s.primaryGood}/${s.pages}`,
    `empty ${s.emptyPages}`,
  ].join('  ');
}
