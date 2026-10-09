/** How many items of one kind a finding quotes. */
export const EVIDENCE_ITEMS = 5;

/** How long one quote may run before it is cut. */
const QUOTE_MAX = 320;

/**
 * What a finding shows the reader as proof: the markup, header or rule it is about, as
 * found on the page, so the claim can be checked against the page source instead of
 * taken on trust. Capped in count and length — a finding is read on a screen, and the
 * fifth example of the same mistake says nothing the first did not.
 */
export function evidence(items: readonly string[]): string[] {
  return items
    .slice(0, EVIDENCE_ITEMS)
    .map((item) =>
      item.length > QUOTE_MAX ? `${item.slice(0, QUOTE_MAX - 1)}…` : item,
    );
}

/** A value written back into an attribute, so the quote reads as the markup it was. */
export const attribute = (value: string) => value.replace(/"/g, '&quot;');
