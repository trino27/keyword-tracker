import { CWV_THRESHOLDS, type ICwvReading, type TCwvMetric, type TCwvSource } from "@app/contracts";
import { cwvBandLabel } from "../../Constants/cwvBandColor";
import { formatInZone } from "../FormatInZone/formatInZone";

/**
 * A Core Web Vital as people read it: "3.1 s", "180 ms", "0.12". One more digit when the
 * short form would print a threshold the value is not: 2540 ms is "2.54 s", never "2.5 s"
 * beside "needs improvement; good is 2.5 s or less".
 */
export function formatCwvValue(metric: TCwvMetric, value: number): string {
	const { good, poor } = CWV_THRESHOLDS[metric];
	const scale = metric === "lcp" ? 1000 : 1;
	const shown = (digits: number) => Number((value / scale).toFixed(digits));
	const landsOnThreshold = (digits: number) => {
		const rounded = shown(digits) * scale;
		return value !== rounded && (rounded === good || rounded === poor);
	};
	let digits = metric === "lcp" ? 1 : metric === "inp" ? 0 : 2;
	while (landsOnThreshold(digits) && digits < 6) digits += 1;
	const text = String(shown(digits));
	if (metric === "lcp") return `${text} s`;
	if (metric === "inp") return `${text} ms`;
	return text;
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

/** Whose experience a value is, as a label: the badge tooltip's second sentence. */
export function cwvSourceLabel(source: TCwvSource): string {
	switch (source) {
		case "url":
			return "Real visitors to this page";
		case "origin":
			return "Real visitors to the whole site";
		case "lab":
			return "Lab test, may vary";
	}
}

/** "LCP 3.1 s — needs improvement. Real visitors to this page, measured Oct 9." */
export function cwvReadingSentence(
	metric: TCwvMetric,
	reading: ICwvReading,
	measuredAt: string,
	timeZone: string,
): string {
	return `${CWV_METRIC_NAME[metric]} ${formatCwvValue(metric, reading.value)} — ${cwvBandLabel[reading.band]}. ${cwvSourceLabel(reading.source)}, measured ${formatInZone(measuredAt, timeZone, "shortDate")}.`;
}
