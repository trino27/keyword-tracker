import { buildCheckGuide, type ICheckGuideTopic } from "../BuildCheckGuide/buildCheckGuide";
import { filterGuide } from "../FilterGuide/filterGuide";

/**
 * What the guide shows. Without a search, the whole guide — the chapters to read and the
 * check reference. With one, only the checks it matched, so a result is on screen at once
 * rather than somewhere below twenty sections of prose; or, matching nothing, says so.
 */
export type TGuideView =
	| { kind: "all"; topics: ICheckGuideTopic[] }
	| { kind: "results"; topics: ICheckGuideTopic[]; matched: number }
	| { kind: "noResults" };

const ALL_TOPICS = buildCheckGuide();

export function guideViewOf(query: string | undefined): TGuideView {
	if (query === undefined || query.trim() === "") return { kind: "all", topics: ALL_TOPICS };
	const topics = filterGuide(ALL_TOPICS, query);
	if (topics.length === 0) return { kind: "noResults" };
	return {
		kind: "results",
		topics,
		matched: topics.reduce((sum, topic) => sum + topic.entries.length, 0),
	};
}
