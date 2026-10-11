/**
 * A finding in a marketer's words: what is wrong, what it costs, and what to do and whom
 * to ask. The catalogue's `label`, `hint` and `explanation` stay as the precise,
 * source-backed technical account; this is the version for the person who has to get it
 * fixed, not the one who fixes it.
 */
export interface IPlainCopy {
  /** One short sentence: what is wrong, without jargon. The report card's title. */
  what: string;
  /** Why it matters, in traffic, clicks, visibility or visitors — never in markup terms. */
  why: string;
  /**
   * What to do, naming who does it: the CMS editor, the developer, the hosting provider…
   * Absent only where the product decided a card reads better without it; the copy test
   * names each such entry, so a forgotten `fix` still fails.
   */
  fix?: string;
}

/** Bounds the plain copy is held to, so a card stays a card. */
export const PLAIN_COPY_LIMITS = {
  what: { min: 15, max: 110 },
  why: { min: 40, max: 340 },
  fix: { min: 40, max: 340 },
} as const;

/**
 * At least one of these appears in every `fix`, because a marketer's next step is to hand
 * the task to someone, and the copy has to say to whom.
 */
export const FIX_AUDIENCE_WORDS = [
  'developer',
  'CMS',
  'editor',
  'writer',
  'hosting',
  'plugin',
  'theme',
  'web team',
] as const;
