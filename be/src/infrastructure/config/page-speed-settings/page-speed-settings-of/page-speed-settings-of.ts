import type { IPageSpeedSettings } from '../page-speed-settings';

/** The key as configured; empty or blank is no key at all. */
export function pageSpeedSettingsFrom(
  raw: string | undefined,
): IPageSpeedSettings {
  const apiKey = raw?.trim() ?? '';
  return { apiKey: apiKey === '' ? null : apiKey };
}
