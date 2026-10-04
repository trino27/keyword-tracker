import type {
  IRankObservation,
  IRankPositionProvider,
  IRankRequest,
} from '../../ports/rank-position-provider.port';
import type { ICurrentPairRecord } from '../snapshot-writer/snapshot-writer.service';
import type { INewSnapshot } from '../snapshot-writer/snapshot-writer.service';
import type { SnapshotWriterService } from '../snapshot-writer/snapshot-writer.service';
import type { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import { PositionFillService, REQUEST_BATCH } from './position-fill.service';

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

/**
 * A provider that can only see today — what a real rank engine is. It stands in for
 * every provider this repository does not have yet: if the fill works with this one
 * without knowing it, it works with a paid API too.
 */
class TodayOnlyProvider implements IRankPositionProvider {
  readonly id = 'today-only';
  readonly calls: IRankRequest[][] = [];

  capture(requests: IRankRequest[]): Promise<IRankObservation[]> {
    this.calls.push(requests);
    return Promise.resolve(
      requests.map(({ target, to }) => ({
        pageId: target.pageId,
        keywordId: target.keywordId,
        capturedAt: to,
        position: 7,
      })),
    );
  }
}

const setup = () => {
  const inserted: INewSnapshot[][] = [];
  const writer = {
    insertManyForWorker: (rows: INewSnapshot[]) => {
      inserted.push(rows);
      return Promise.resolve(rows.length);
    },
  } as unknown as SnapshotWriterService;
  const openTransactions = { depth: 0, maxDepth: 0 };
  const transactions = {
    run: async <T>(work: (tx: never) => Promise<T>) => {
      openTransactions.depth += 1;
      openTransactions.maxDepth = Math.max(
        openTransactions.maxDepth,
        openTransactions.depth,
      );
      try {
        return await work(undefined as never);
      } finally {
        openTransactions.depth -= 1;
      }
    },
  } as unknown as TransactionRunner;
  const provider = new TodayOnlyProvider();
  const service = new PositionFillService(writer, transactions, provider);
  return { service, provider, inserted, openTransactions };
};

describe('PositionFillService', () => {
  it('writes what a provider covers, not what it was asked for', async () => {
    const { service, provider, inserted } = setup();

    const filled = await service.fill([pair()], NOW, 366, provider);

    // Asked for 366 days, answered for one — a short answer is an answer.
    expect(provider.calls[0][0]).toMatchObject({
      from: new Date(END.getTime() - 365 * DAY),
      to: END,
    });
    expect(filled).toMatchObject({ pairs: 1, days: 366, rowsAdded: 1 });
    expect(inserted.flat()).toEqual([
      { pageId: 1, keywordId: 2, capturedAt: END, position: 7 },
    ]);
  });

  it('asks only for the days a pair is missing', async () => {
    const { service, provider } = setup();

    await service.fill(
      [
        pair({
          lastCapturedAt: new Date(END.getTime() - 3 * DAY),
          lastPosition: 9,
        }),
      ],
      NOW,
      366,
      provider,
    );

    expect(provider.calls[0][0].from).toEqual(
      new Date(END.getTime() - 2 * DAY),
    );
  });

  it('asks nothing at all for a pair already filled up to today', async () => {
    const { service, provider, inserted } = setup();

    const filled = await service.fill(
      [pair({ lastCapturedAt: END, lastPosition: 4 })],
      NOW,
      366,
      provider,
    );

    expect(provider.calls).toEqual([]);
    expect(inserted).toEqual([]);
    expect(filled.rowsAdded).toBe(0);
  });

  it('batches pairs into provider calls and holds no transaction across one', async () => {
    const { service, provider, openTransactions } = setup();
    const pairs = Array.from({ length: REQUEST_BATCH + 1 }, (_, index) =>
      pair({ pageId: index + 1 }),
    );

    const filled = await service.fill(pairs, NOW, 366, provider);

    expect(provider.calls.map((call) => call.length)).toEqual([
      REQUEST_BATCH,
      1,
    ]);
    expect(filled.rowsAdded).toBe(REQUEST_BATCH + 1);
    // A provider call may be a network request; it must never happen inside a
    // transaction, so no transaction is open while one is in flight.
    expect(openTransactions.maxDepth).toBe(1);
    expect(openTransactions.depth).toBe(0);
  });
});
