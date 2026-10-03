import type {
  ICurrentPairRecord,
  INewSnapshot,
  SnapshotWriterService,
} from '@modules/pages/services/snapshot-writer/snapshot-writer.service';
import { generatePositions } from '@modules/pages/services/position-generator/generate-positions/generate-positions';
import { PositionFillService } from '@modules/pages/services/position-fill/position-fill.service';
import { PositionSeedService } from './position-seed.service';

const NOW = new Date('2026-10-03T15:00:00Z');
const END = new Date('2026-10-03T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

const pair = (
  overrides: Partial<ICurrentPairRecord> = {},
): ICurrentPairRecord => ({
  pageId: 1,
  keywordId: 2,
  url: 'https://a.example/post/',
  term: 'seo audit',
  relevance: 1,
  lastCapturedAt: null,
  lastPosition: null,
  ...overrides,
});

const setup = (pairs: ICurrentPairRecord[]) => {
  const inserted: INewSnapshot[][] = [];
  const writer = {
    listCurrentPairsForWorker: () => Promise.resolve(pairs),
    insertManyForWorker: (rows: INewSnapshot[]) => {
      inserted.push(rows);
      return Promise.resolve(rows.length);
    },
    countForWorker: () => Promise.resolve(inserted.flat().length),
  } as unknown as SnapshotWriterService;
  const service = new PositionSeedService(
    writer,
    new PositionFillService(writer),
  );
  return { service, inserted };
};

describe('PositionSeedService', () => {
  it('gives a new pair a full history ending at the latest noon', async () => {
    const { service, inserted } = setup([pair()]);

    const fill = await service.fillForWorker(NOW);

    const rows = inserted.flat();
    expect(fill).toMatchObject({ pairs: 1, days: 50_000, rowsAdded: 50_000 });
    expect(rows.at(-1)?.capturedAt).toEqual(END);
    expect(rows[0].capturedAt).toEqual(new Date(END.getTime() - 49_999 * DAY));
    expect(inserted.every((batch) => batch.length <= 5_000)).toBe(true);
  });

  it('continues an existing pair from the day after its last snapshot', async () => {
    const lastCapturedAt = new Date(END.getTime() - 3 * DAY);
    const { service, inserted } = setup([
      pair({ lastCapturedAt, lastPosition: 9 }),
    ]);

    await service.fillForWorker(NOW);

    const rows = inserted.flat();
    expect(rows.map((row) => row.capturedAt)).toEqual([
      new Date(END.getTime() - 2 * DAY),
      new Date(END.getTime() - DAY),
      END,
    ]);
    const expected = generatePositions(pair(), rows[0].capturedAt, 3, 9);
    expect(rows.map((row) => row.position)).toEqual(
      expected.map((row) => row.position),
    );
  });

  it('adds nothing for a pair already filled up to today', async () => {
    const { service, inserted } = setup([
      pair({ lastCapturedAt: END, lastPosition: 4 }),
    ]);

    const fill = await service.fillForWorker(NOW);

    expect(inserted.flat()).toEqual([]);
    expect(fill.rowsAdded).toBe(0);
  });
});
