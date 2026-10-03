import { DAY_MS } from '../history-days/history-days';
import { generatePositions } from './generate-positions';

const pair = {
  url: 'https://yoast.com/how-to-remove-www-from-your-url/',
  term: 'remove www',
  relevance: 1,
};
const from = new Date('2025-10-01T12:00:00Z');

describe('generatePositions', () => {
  it('the same pair and days give an identical series', () => {
    expect(generatePositions(pair, from, 60)).toEqual(
      generatePositions(pair, from, 60),
    );
  });

  it('a→c equals a→b continued from b’s last position', () => {
    const whole = generatePositions(pair, from, 100);
    const first = generatePositions(pair, from, 40);
    const rest = generatePositions(
      pair,
      new Date(from.getTime() + 40 * DAY_MS),
      60,
      first.at(-1)!.position,
    );

    expect([...first, ...rest]).toEqual(whole);
  });

  it('captures daily at 12:00 UTC and keeps every value in 1..100', () => {
    const weak = generatePositions({ ...pair, relevance: 0.05 }, from, 365);

    for (const [i, { capturedAt, position }] of weak.entries()) {
      expect(capturedAt.getTime()).toBe(from.getTime() + i * DAY_MS);
      expect(capturedAt.getUTCHours()).toBe(12);
      expect(position).toBeGreaterThanOrEqual(1);
      expect(position).toBeLessThanOrEqual(100);
    }
  });

  it('stays near the baseline: a strong pair averages in the top 20', () => {
    const series = generatePositions(pair, from, 365);
    const mean =
      series.reduce((sum, { position }) => sum + position, 0) / series.length;

    expect(mean).toBeLessThan(20);
  });

  it('different pairs walk differently', () => {
    const other = generatePositions({ ...pair, term: 'www' }, from, 30);

    expect(other.map((p) => p.position)).not.toEqual(
      generatePositions(pair, from, 30).map((p) => p.position),
    );
  });
});
