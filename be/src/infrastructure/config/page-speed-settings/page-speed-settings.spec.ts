import { pageSpeedSettingsFrom } from './page-speed-settings';

describe('pageSpeedSettingsFrom', () => {
  it.each([undefined, '', '   ', '\t\n'])(
    'an empty or blank key (%j) is null',
    (raw) => {
      expect(pageSpeedSettingsFrom(raw)).toEqual({ apiKey: null });
    },
  );

  it('keeps a key, trimmed', () => {
    expect(pageSpeedSettingsFrom('  abc  ')).toEqual({ apiKey: 'abc' });
  });
});
