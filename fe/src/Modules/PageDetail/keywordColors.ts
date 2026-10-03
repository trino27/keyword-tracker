/** One colour per keyword, stable by its position in the page's keyword list. */
const KEYWORD_COLORS = ["indigo", "teal", "orange", "grape", "cyan", "pink", "lime", "yellow"];

export const keywordColor = (index: number): string =>
	`var(--mantine-color-${KEYWORD_COLORS[index % KEYWORD_COLORS.length]}-6)`;
