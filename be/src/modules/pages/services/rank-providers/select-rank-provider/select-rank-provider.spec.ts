import { InvariantViolationException } from '@core/exceptions/invariant-violation-exception/invariant-violation.exception';
import type { IRankPositionProvider } from '../../../ports/rank-position-provider.port';
import { selectRankProvider } from './select-rank-provider';

const provider = (id: string) =>
  ({ id, capture: () => Promise.resolve([]) }) as IRankPositionProvider;

const available = [provider('simulation'), provider('acme-ranks')];

describe('selectRankProvider', () => {
  it('picks the provider the id names', () => {
    expect(selectRankProvider('acme-ranks', available).id).toBe('acme-ranks');
  });

  it('falls back to the first registered provider when none is set', () => {
    expect(selectRankProvider(undefined, available).id).toBe('simulation');
  });

  it('refuses an id this build does not have, naming the ones it does', () => {
    expect(() => selectRankProvider('typo', available)).toThrow(
      InvariantViolationException,
    );
    expect(() => selectRankProvider('typo', available)).toThrow(
      expect.objectContaining({
        response: {
          errorCode: 'INVARIANT_VIOLATION',
          message:
            'Unknown RANK_PROVIDER "typo"; this build has: simulation, acme-ranks',
        },
      }),
    );
  });
});
