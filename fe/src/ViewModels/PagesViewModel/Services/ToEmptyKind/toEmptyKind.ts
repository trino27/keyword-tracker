/**
 * Why the list is empty decides what the empty state offers:
 * - noClients: nothing tracked yet → "Add a client";
 * - noMatches: a search found nothing → "Clear the search";
 * - noPagesYet: a client with no crawled pages (crawling, or the crawl failed) → the banner says which;
 * - noPages: clients exist but none has pages yet.
 */
export type TEmptyKind = "noClients" | "noMatches" | "noPagesYet" | "noPages";

export function toEmptyKind(
	total: number,
	filters: { clientId?: number; q?: string },
	clientCount: number,
): TEmptyKind | null {
	if (total > 0) return null;
	if (filters.q) return "noMatches";
	if (filters.clientId !== undefined) return "noPagesYet";
	return clientCount === 0 ? "noClients" : "noPages";
}
