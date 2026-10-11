/** A snippet of what the check wants to see, as it appears in the page, a header or a file. */
export interface ICheckExample {
	/** What the markup, header or file looks like when the check passes. */
	good: string;
	/** What it looks like when the check fails, where showing it teaches something. */
	bad?: string;
	/** How the snippet reads: page markup, an HTTP exchange, robots.txt, JSON-LD, a sitemap, or prose. */
	lang: "html" | "http" | "robots" | "json" | "xml" | "text";
}

/** Everything the guide says about one check beyond what the catalogue already holds. */
export interface ICheckCriteria {
	/** What a page (or site) has to be like for the check to pass. */
	passes: string;
	/** Exactly what makes the check fail. */
	fails: string;
	/**
	 * What a page gains when the check passes — the consequence in search, for readers or for
	 * the site. What failing costs is the catalogue's `plain.why`, so it is not repeated here.
	 */
	ifPasses: string;
	example: ICheckExample;
	/** What the tracker's code actually does to reach its verdict — read from the check, not guessed. */
	howChecked: string;
	/** How a person confirms the verdict on the live site, step by step, with tools anyone can use. */
	manualCheck: readonly string[];
}

export const seconds = (ms: number) => `${ms / 1000} s`;
export const thousands = (value: number) => value.toLocaleString("en-US");
