/** "Showing 21–40 of 47 pages" — the list's count line, above the table. */
export function describeResultRange(page: number, pageSize: number, total: number): string {
	if (total === 0) return "No pages";
	const first = (page - 1) * pageSize + 1;
	if (first > total) return `${total} ${total === 1 ? "page" : "pages"}`;
	const last = Math.min(page * pageSize, total);
	return `Showing ${first}–${last} of ${total} ${total === 1 ? "page" : "pages"}`;
}
