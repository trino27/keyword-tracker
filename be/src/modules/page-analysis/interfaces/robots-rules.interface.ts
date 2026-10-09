/**
 * What the site's robots.txt says about a URL, for a crawler named by its product token.
 *
 * An interface rather than the crawl's own policy object so the analysis stays pure: a
 * check asks a question of a fixed file, and a test answers it with a stub.
 */
export interface IRobotsRules {
  /**
   * `true` allowed, `false` disallowed, `null` when this robots.txt does not govern the
   * URL at all — another host, or another scheme — so nothing can be said about it.
   */
  allows(url: string, userAgent: string): boolean | null;
  /**
   * The robots.txt line that decided the answer, as written and numbered —
   * `line 5: Disallow: /blog/` — so a finding can quote the rule rather than assert it.
   * Null when no rule matched or there is no file.
   */
  matchingRule(url: string, userAgent: string): string | null;
}
