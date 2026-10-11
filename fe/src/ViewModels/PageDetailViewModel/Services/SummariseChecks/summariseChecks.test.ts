import { describe, expect, it } from "vitest";
import {
	ACTIVE_ISSUE_CODES,
	ACTIVE_LIGHTHOUSE_CODES,
	type TCheckStatus,
	type TChecksByOwner,
} from "@app/contracts";
import { CHECK_TOPICS, CHECK_TOPIC_OF } from "@Core/Constants/checkTopics";
import { summariseChecks, type IChecksContext } from "./summariseChecks";

type TStatuses = Partial<Record<string, TCheckStatus>>;

const crawl = (statuses: TStatuses = {}) =>
	ACTIVE_ISSUE_CODES.map((code) => ({ code, status: statuses[code] ?? "passed" }));

const lighthouse = (statuses: TStatuses = {}) =>
	ACTIVE_LIGHTHOUSE_CODES.map((code) => ({ code, status: statuses[code] ?? "passed" }));

const CONTEXT: IChecksContext = {
	crawledAt: "2026-10-10T12:00:00Z",
	lighthouseMeasuredAt: "2026-10-11T08:00:00Z",
	pageSpeedState: "active",
};

const summarise = (byOwner: Partial<TChecksByOwner>, context: Partial<IChecksContext> = {}) =>
	summariseChecks(
		{ crawl: crawl(), lighthouse: lighthouse(), ...byOwner },
		{ ...CONTEXT, ...context },
	);

const rowWith = (summary: ReturnType<typeof summariseChecks>, code: string) =>
	summary.sections
		.flatMap((section) => section.rows)
		.find((row) =>
			[...row.cells.crawl, ...row.cells.lighthouse].some((cell) => cell.code === code),
		);

/** The crawl codes a counterpart group gathers onto the row of its first code. */
const GATHERED = [
	"CANONICAL_MISMATCH",
	"CANONICAL_TO_HTTP",
	"CANONICAL_CONFLICT",
	"CANONICAL_RELATIVE",
	"ROBOTS_BLOCKS_GOOGLEBOT",
];

/**
 * Counted from the catalogue rather than written in: the subtitles are about how many
 * checks there are, and a test that hard-codes the number fails on the next check
 * added without anything being wrong.
 */
const CRAWL = ACTIVE_ISSUE_CODES.length;

/** The chapter heading a code sits under, as `CHECK_TOPICS` names it today. */
const headingOf = (code: keyof typeof CHECK_TOPIC_OF) =>
	CHECK_TOPICS.find(({ id }) => id === CHECK_TOPIC_OF[code])!.title;
const LIGHTHOUSE = ACTIVE_LIGHTHOUSE_CODES.length;

describe("summariseChecks", () => {
	/** The Info tab's chapters, in its order, so a check sits under one heading on both screens. */
	it("groups every row under its chapter, in the Info tab's order", () => {
		const { sections } = summarise({});
		const order: string[] = CHECK_TOPICS.map(({ title }) => title);

		expect(sections[0].heading).toBe("Titles");
		expect(sections[0].rows[0].cells.crawl).toEqual([
			{ code: "TITLE_MISSING", label: "Title is present", status: "passed", reason: null },
		]);
		expect(sections.map(({ heading }) => order.indexOf(heading))).toEqual(
			[...sections.map(({ heading }) => order.indexOf(heading))].sort((a, b) => a - b),
		);
		for (const section of sections)
			for (const row of section.rows) {
				const lead = row.cells.crawl[0]?.code ?? row.cells.lighthouse[0].code;
				const topic = CHECK_TOPICS.find(
					({ id }) => id === CHECK_TOPIC_OF[lead as keyof typeof CHECK_TOPIC_OF],
				)!;
				expect({ lead, heading: section.heading }).toEqual({ lead, heading: topic.title });
			}
	});

	it("keeps the backend's order within a chapter, a group on the row of its first code", () => {
		const ours = summarise({}).sections.flatMap((section) =>
			section.rows
				.filter((row) => row.cells.crawl.length > 0)
				.map((row) => row.cells.crawl[0].code),
		);

		expect([...ours].sort()).toEqual(
			ACTIVE_ISSUE_CODES.filter((code) => !GATHERED.includes(code)).sort(),
		);
		const headings = summarise({}).sections.find(({ heading }) => heading === "Headings")!;
		expect(
			headings.rows.map((row) => row.cells.crawl[0]?.code ?? row.cells.lighthouse[0].code),
		).toEqual(
			[...ACTIVE_ISSUE_CODES, ...ACTIVE_LIGHTHOUSE_CODES].filter(
				(code) => CHECK_TOPIC_OF[code] === "headings",
			),
		);
	});

	/** The problem's name beside a green mark reads as if the problem were the good outcome. */
	it("reads a passed check as what is right, and a failed one as the problem", () => {
		const summary = summarise({ crawl: crawl({ TITLE_LENGTH: "failed" }) });

		expect(rowWith(summary, "LANG_MISSING")?.cells.crawl[0].label).toBe("Language is declared");
		expect(rowWith(summary, "LH_IS_CRAWLABLE")?.cells.lighthouse[0].label).toBe(
			"Page is open to search engines",
		);
		expect(rowWith(summary, "TITLE_LENGTH")?.cells.crawl[0].label).toBe("Title length");
	});

	it("leads a chapter with its failures, and counts them", () => {
		const titles = summarise({ crawl: crawl({ TITLE_LENGTH: "failed" }) }).sections.find(
			({ heading }) => heading === "Titles",
		)!;

		expect(titles.rows[0].cells.crawl[0].code).toBe("TITLE_LENGTH");
		expect(titles.failed).toBe(1);
	});

	/** PAGEDETAIL-009: one row per counterpart group, each owner's codes in its own cell. */
	it("puts a counterpart group on one row, the canonical five beside Lighthouse's one", () => {
		const row = rowWith(summarise({}), "CANONICAL_RELATIVE")!;

		expect(row.cells.crawl.map(({ code }) => code)).toEqual([
			"CANONICAL_MISSING",
			"CANONICAL_MISMATCH",
			"CANONICAL_TO_HTTP",
			"CANONICAL_CONFLICT",
			"CANONICAL_RELATIVE",
		]);
		expect(row.cells.lighthouse.map(({ code }) => code)).toEqual(["LH_CANONICAL"]);
	});

	it("puts each Lighthouse-only audit under its own chapter, failures first", () => {
		const { sections } = summarise({
			lighthouse: lighthouse({ LH_LINK_TEXT: "failed", LH_HTTP_STATUS_CODE: "failed" }),
		});
		const chapterOf = (code: "LH_LINK_TEXT" | "LH_HTTP_STATUS_CODE") =>
			sections.find(({ heading }) => heading === headingOf(code))!;

		expect(chapterOf("LH_HTTP_STATUS_CODE").rows[0].cells.lighthouse[0].code).toBe(
			"LH_HTTP_STATUS_CODE",
		);
		expect(chapterOf("LH_LINK_TEXT").rows[0].cells.lighthouse[0].code).toBe("LH_LINK_TEXT");
		for (const row of chapterOf("LH_LINK_TEXT").rows) expect(row.cells.crawl).toEqual([]);
	});

	/**
	 * Lighthouse's accessibility audits are retired: the page shows its accessibility score
	 * instead. A verdict on one, were it ever sent, has no row and no chapter.
	 */
	it("lists no accessibility audit, even one sent as failed", () => {
		const summary = summarise({
			lighthouse: [...lighthouse(), { code: "LH_COLOR_CONTRAST", status: "failed" }],
		});

		expect(rowWith(summary, "LH_COLOR_CONTRAST")).toBeUndefined();
		expect(summary.sections.every(({ heading }) => !heading.startsWith("Accessibility"))).toBe(
			true,
		);
	});

	it("lists every check of both owners exactly once", () => {
		const cells = summarise({}).sections.flatMap((section) =>
			section.rows.flatMap((row) => [...row.cells.crawl, ...row.cells.lighthouse]),
		);

		expect(cells).toHaveLength(CRAWL + LIGHTHOUSE);
		expect(new Set(cells.map(({ code }) => code)).size).toBe(CRAWL + LIGHTHOUSE);
	});

	/** PAGEDETAIL-009, D18: a pass on one side and a failure on the other is said. */
	it("marks a row whose owners disagree, and only such a row", () => {
		const summary = summarise({ lighthouse: lighthouse({ LH_CANONICAL: "failed" }) });

		expect(rowWith(summary, "LH_CANONICAL")?.disagree).toBe(true);
		expect(rowWith(summary, "LH_CANONICAL")?.why).toMatch(
			/Lighthouse does not judge a missing canonical/,
		);
		expect(rowWith(summary, "LH_DOCUMENT_TITLE")?.why).toBeNull();
		expect(rowWith(summary, "LH_DOCUMENT_TITLE")?.disagree).toBe(false);
		expect(rowWith(summary, "LH_ROBOTS_TXT")?.disagree).toBe(false);
	});

	it("does not call two failures a disagreement", () => {
		const summary = summarise({
			crawl: crawl({ TITLE_MISSING: "failed" }),
			lighthouse: lighthouse({ LH_DOCUMENT_TITLE: "failed" }),
		});

		expect(rowWith(summary, "TITLE_MISSING")?.disagree).toBe(false);
	});

	it("subtitles each column with what it judged and what it could not", () => {
		const { columns } = summarise({
			crawl: crawl({ TITLE_LENGTH: "failed", HEADING_SKIP: "notApplicable" }),
			lighthouse: lighthouse({
				LH_LINK_TEXT: "notApplicable",
				LH_ROBOTS_TXT: "notYetChecked",
			}),
		});

		expect(columns.crawl).toMatchObject({
			title: "Our checks",
			judgedAt: CONTEXT.crawledAt,
			subtitle: `${CRAWL - 1} judged · 1 not applicable`,
			empty: null,
		});
		expect(columns.lighthouse).toMatchObject({
			title: "Lighthouse",
			judgedAt: CONTEXT.lighthouseMeasuredAt,
			subtitle: `${LIGHTHOUSE - 2} judged · 1 not applicable · 1 not recorded`,
		});
	});

	it("counts the failures of both owners for the closing line", () => {
		const { failed } = summarise({
			crawl: crawl({ TITLE_MISSING: "failed" }),
			lighthouse: lighthouse({ LH_DOCUMENT_TITLE: "failed", LH_ROBOTS_TXT: "failed" }),
		});

		expect(failed).toBe(3);
	});

	it("gives each owner's skipped and unrecorded checks their own reason", () => {
		const summary = summarise({
			crawl: crawl({ IMAGES_MISSING_ALT: "notApplicable", LANG_MISSING: "notYetChecked" }),
			lighthouse: lighthouse({
				LH_LINK_TEXT: "notApplicable",
				LH_ROBOTS_TXT: "notYetChecked",
			}),
		});
		const reason = (code: string) => {
			const row = rowWith(summary, code)!;
			return [...row.cells.crawl, ...row.cells.lighthouse].find((cell) => cell.code === code)
				?.reason;
		};

		expect(reason("IMAGES_MISSING_ALT")).toBe("The page has no images.");
		expect(reason("LANG_MISSING")).toBe("Added after this page was last crawled.");
		expect(reason("LH_LINK_TEXT")).toBe("Lighthouse found nothing on the page for this audit.");
		expect(reason("LH_ROBOTS_TXT")).toBe(
			"Lighthouse did not report this audit in its last run.",
		);
	});

	/** D19: an owner with no record says why once, and none of its cells is invented. */
	it.each([
		["active", "Lighthouse has not checked this page yet."],
		["notConfigured", "PageSpeed is not configured, so Lighthouse has not checked this page."],
		["keyRejected", "Google rejected the PageSpeed key, so Lighthouse checks are paused."],
	] as const)("says why Lighthouse has nothing when PageSpeed is %s", (state, line) => {
		const summary = summarise(
			{ lighthouse: null },
			{ pageSpeedState: state, lighthouseMeasuredAt: null },
		);

		expect(summary.columns.lighthouse).toMatchObject({ empty: line, judgedAt: null });
		expect(summary.sections.map(({ heading }) => heading)).not.toContain(
			headingOf("LH_LINK_TEXT"),
		);
		expect(rowWith(summary, "CANONICAL_RELATIVE")?.cells.lighthouse).toEqual([]);
	});

	it("asks for a re-crawl when the crawl recorded nothing, and keeps Lighthouse's rows", () => {
		const summary = summarise({ crawl: null });

		expect(summary.columns.crawl.empty).toBe("Re-crawl this page to see each check.");
		expect(rowWith(summary, "LH_CANONICAL")?.cells.crawl).toEqual([]);
		expect(rowWith(summary, "THIN_CONTENT")).toBeUndefined();
	});
});
