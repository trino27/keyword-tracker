import { describe, expect, it } from 'vitest';
import { todayInZone } from './today-in-zone.util';

describe('todayInZone', () => {
  it('is still yesterday in Toronto after UTC midnight', () => {
    expect(
      todayInZone(new Date('2026-11-02T03:30:00Z'), 'America/Toronto'),
    ).toBe('2026-11-01');
  });

  it('is already tomorrow in Tokyo', () => {
    expect(todayInZone(new Date('2026-10-03T16:00:00Z'), 'Asia/Tokyo')).toBe(
      '2026-10-04',
    );
  });

  it('is the UTC date in UTC', () => {
    expect(todayInZone(new Date('2026-10-03T23:59:59Z'), 'UTC')).toBe(
      '2026-10-03',
    );
  });
});
