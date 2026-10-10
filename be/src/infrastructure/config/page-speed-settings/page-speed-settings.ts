/** What the PageSpeed integration is configured with. */
export interface IPageSpeedSettings {
  /** Null when unset or blank: the worker does not start and every payload says so. */
  apiKey: string | null;
}

/**
 * A provider rather than a `ConfigService` read at each site, so a test app overrides it
 * in one place — and a developer's real key in `.env` can never reach a test.
 */
export const PAGE_SPEED_SETTINGS = Symbol('PAGE_SPEED_SETTINGS');

export function pageSpeedSettingsFrom(
  raw: string | undefined,
): IPageSpeedSettings {
  const apiKey = raw?.trim() ?? '';
  return { apiKey: apiKey === '' ? null : apiKey };
}
