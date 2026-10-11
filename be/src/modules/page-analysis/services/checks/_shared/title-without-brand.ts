/**
 * The separator a site's name hangs off a title by: "Post | Acme", "Post – Acme". Spaced on
 * both sides, so a hyphenated word ("e-mail") is not split. The crawl's soft-404 test
 * splits a title the same way (`post-selection.service.ts`).
 */
const TITLE_SEPARATOR = /\s[|•·–—-]\s/;

/** The title as the post names itself, without the site's name after it. */
export const titleWithoutBrand = (title: string): string =>
  title.split(TITLE_SEPARATOR)[0];
