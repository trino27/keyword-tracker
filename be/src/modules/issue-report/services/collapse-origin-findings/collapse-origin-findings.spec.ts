import {
  collapseOriginFindings,
  type IPageFinding,
} from './collapse-origin-findings';

const page = (id: number) => ({
  id,
  url: `https://a.example/p${id}/`,
  title: `Post ${id}`,
});

const speed = (
  id: number,
  source: 'url' | 'origin' | 'lab',
  value = 320,
  measuredAt = new Date('2026-10-09T12:00:00Z'),
): IPageFinding => ({
  issue: {
    code: 'CWV_INP_NEEDS_IMPROVEMENT',
    severity: 'notice',
    details: { value, max: 200, source },
  },
  page: page(id),
  measuredAt,
});

const crawl = (id: number): IPageFinding => ({
  issue: { code: 'H1_MISSING', severity: 'error', details: {} },
  page: page(id),
  measuredAt: null,
});

describe('collapseOriginFindings', () => {
  it('folds origin findings into one row per code with the page count', () => {
    const rows = collapseOriginFindings([
      speed(1, 'origin'),
      speed(2, 'origin'),
      speed(3, 'origin'),
    ]);

    expect(rows).toEqual([
      {
        code: 'CWV_INP_NEEDS_IMPROVEMENT',
        severity: 'notice',
        details: { value: 320, max: 200, source: 'origin' },
        location: { kind: 'allPages', pageCount: 3 },
      },
    ]);
  });

  it('keeps url and lab findings per page', () => {
    const rows = collapseOriginFindings([speed(1, 'url'), speed(2, 'lab')]);

    expect(rows.map((row) => row.location)).toEqual([
      { kind: 'page', page: page(1) },
      { kind: 'page', page: page(2) },
    ]);
  });

  it('keeps crawl findings per page, untouched', () => {
    expect(collapseOriginFindings([crawl(4)])).toEqual([
      {
        code: 'H1_MISSING',
        severity: 'error',
        details: {},
        location: { kind: 'page', page: page(4) },
      },
    ]);
  });

  it('carries the details of the most recently measured page', () => {
    const [row] = collapseOriginFindings([
      speed(1, 'origin', 300, new Date('2026-10-08T12:00:00Z')),
      speed(2, 'origin', 340, new Date('2026-10-09T12:00:00Z')),
    ]);

    expect(row.details).toMatchObject({ value: 340 });
  });

  it('lets one code appear both as a whole-site row and per page', () => {
    const rows = collapseOriginFindings([
      speed(1, 'url'),
      speed(2, 'origin'),
      speed(3, 'origin'),
    ]);

    expect(rows.map((row) => row.location.kind).sort()).toEqual([
      'allPages',
      'page',
    ]);
  });
});
