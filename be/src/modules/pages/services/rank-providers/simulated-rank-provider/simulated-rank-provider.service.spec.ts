import type { IRankTarget } from '../../../ports/rank-position-provider.port';
import { generatePositions } from '../../position-generator/generate-positions/generate-positions';
import { SimulatedRankProvider } from './simulated-rank-provider.service';

const END = new Date('2026-10-03T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

const target = (overrides: Partial<IRankTarget> = {}): IRankTarget => ({
  pageId: 1,
  keywordId: 2,
  url: 'https://a.example/post/',
  term: 'seo audit',
  relevance: 1,
  lastCapturedAt: null,
  lastPosition: null,
  ...overrides,
});

describe('SimulatedRankProvider', () => {
  const provider = new SimulatedRankProvider();

  it('covers every day of the window, past days included', async () => {
    const from = new Date(END.getTime() - 2 * DAY);

    const observations = await provider.capture([
      { target: target(), from, to: END },
    ]);

    expect(observations.map((row) => row.capturedAt)).toEqual([
      from,
      new Date(END.getTime() - DAY),
      END,
    ]);
    expect(observations.every((row) => row.pageId === 1)).toBe(true);
  });

  it('continues the walk from the position already stored', async () => {
    const from = new Date(END.getTime() - DAY);

    const observations = await provider.capture([
      {
        target: target({
          lastCapturedAt: new Date(END.getTime() - 2 * DAY),
          lastPosition: 9,
        }),
        from,
        to: END,
      },
    ]);

    expect(observations.map((row) => row.position)).toEqual(
      generatePositions(target(), from, 2, 9).map((row) => row.position),
    );
  });

  it('answers for every request in the batch', async () => {
    const observations = await provider.capture([
      { target: target({ pageId: 1 }), from: END, to: END },
      { target: target({ pageId: 2 }), from: END, to: END },
    ]);

    expect(observations.map((row) => row.pageId)).toEqual([1, 2]);
  });
});
