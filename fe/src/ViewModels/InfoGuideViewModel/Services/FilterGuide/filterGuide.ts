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

/** The chapters with only the entries that pass, and no chapter left empty. */
const narrowed = (topics: ICheckGuideTopic[], keep: (entry: ICheckGuideEntry) => boolean) =>
	topics
		.map((topic) => ({ ...topic, entries: topic.entries.filter(keep) }))
		.filter((topic) => topic.entries.length > 0);

/**
 * The chapters narrowed to the checks whose code or words contain every word of the
 * search, case-insensitively; a chapter left with nothing is dropped. No search: all.
 *
 * A search that is exactly one check's code is that check alone — a link such as
 * `/info?q=CANONICAL_TO_HTTP` opens its card, not every card whose text names it.
 */
export function filterGuide(
	topics: ICheckGuideTopic[],
	query: string | undefined,
): ICheckGuideTopic[] {
	const trimmed = (query ?? "").trim();
	const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0) return topics;
	const code = trimmed.toUpperCase();
	if (topics.some((topic) => topic.entries.some((entry) => entry.code === code)))
		return narrowed(topics, (entry) => entry.code === code);
	return narrowed(topics, (entry) => {
		const haystack = haystackOf(entry);
		return words.every((word) => haystack.includes(word));
	});
}
