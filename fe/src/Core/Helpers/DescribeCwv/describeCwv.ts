import type { TCwvMetric, TCwvSource } from "@app/contracts";

/** A Core Web Vital as people read it: "3.1 s", "180 ms", "0.12". */
export function formatCwvValue(metric: TCwvMetric, value: number): string {
	if (metric === "lcp") return `${Number((value / 1000).toFixed(1))} s`;
	if (metric === "inp") return `${Math.round(value)} ms`;
	return String(Number(value.toFixed(2)));
}

/** Whose experience a value is, in words: the page's visitors, the site's, or a lab run. */
export function cwvSourcePhrase(source: TCwvSource): string {
	switch (source) {
		case "url":
			return "this page's real visitors";
		case "origin":
			return "the whole site's real visitors";
		case "lab":
			return "a lab test, which may vary";
	}
}

export const CWV_METRIC_NAME: Record<TCwvMetric, string> = {
	lcp: "LCP",
	inp: "INP",
	cls: "CLS",
};
