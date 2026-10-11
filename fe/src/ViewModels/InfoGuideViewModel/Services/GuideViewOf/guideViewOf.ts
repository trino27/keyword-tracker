import { buildCheckGuide, type ICheckGuideTopic } from "../BuildCheckGuide/buildCheckGuide";
import { filterGuide } from "../FilterGuide/filterGuide";

/** The chapters on screen, split into the check reference and Lighthouse's own part. */
export interface IGuideParts {
	reference: ICheckGuideTopic[];
	lighthouse: ICheckGuideTopic[];
}

/**
 * What the guide shows. Without a search, the whole guide — the chapters to read, the
 * check reference and Lighthouse's audits. With one, only the checks it matched, so a
 * result is on screen at once rather than somewhere below twenty sections of prose; or,
 * matching nothing, says so.
 */
export type TGuideView =
	| ({ kind: "all" } & IGuideParts)
	| ({ kind: "results"; matched: number } & IGuideParts)
	| { kind: "noResults" };

const ALL_TOPICS = buildCheckGuide();

const partsOf = (topics: ICheckGuideTopic[]): IGuideParts => ({
	reference: topics.filter((topic) => topic.part === "reference"),
	lighthouse: topics.filter((topic) => topic.part === "lighthouse"),
});

export function guideViewOf(query: string | undefined): TGuideView {
	if (query === undefined || query.trim() === "") return { kind: "all", ...partsOf(ALL_TOPICS) };
	const topics = filterGuide(ALL_TOPICS, query);
	if (topics.length === 0) return { kind: "noResults" };
	return {
		kind: "results",
		...partsOf(topics),
		matched: topics.reduce((sum, topic) => sum + topic.entries.length, 0),
	};
}
