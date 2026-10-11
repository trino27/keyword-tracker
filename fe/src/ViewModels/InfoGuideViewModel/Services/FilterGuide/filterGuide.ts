import type { ICheckGuideEntry, ICheckGuideTopic } from "../BuildCheckGuide/buildCheckGuide";

const haystackOf = (entry: ICheckGuideEntry) =>
	[
		entry.code,
		entry.code.replaceAll("_", " "),
		entry.label,
		entry.plain.what,
		entry.plain.why,
		entry.plain.fix ?? "",
		entry.hint,
		entry.explanation,
		entry.passes,
		entry.fails,
		entry.ifPasses,
		entry.howChecked,
		...entry.manualCheck,
	]
		.join("\n")
		.toLowerCase();

/**
 * The chapters narrowed to the checks whose code or words contain every word of the
 * search, case-insensitively; a chapter left with nothing is dropped. No search: all.
 */
export function filterGuide(
	topics: ICheckGuideTopic[],
	query: string | undefined,
): ICheckGuideTopic[] {
	const words = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0) return topics;
	return topics
		.map((topic) => ({
			...topic,
			entries: topic.entries.filter((entry) => {
				const haystack = haystackOf(entry);
				return words.every((word) => haystack.includes(word));
			}),
		}))
		.filter((topic) => topic.entries.length > 0);
}
