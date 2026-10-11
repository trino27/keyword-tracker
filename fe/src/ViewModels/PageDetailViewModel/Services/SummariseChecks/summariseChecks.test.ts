import { describe, expect, it } from "vitest";
import {
	ACTIVE_ISSUE_CODES,
	LIGHTHOUSE_CATALOGUE,
	LIGHTHOUSE_ISSUE_CODES,
	type TCheckStatus,
	type TChecksByOwner,
} from "@app/contracts";
import { summariseChecks, type IChecksContext } from "./summariseChecks";

type TStatuses = Partial<Record<string, TCheckStatus>>;

const crawl = (statuses: TStatuses = {}) =>
	ACTIVE_ISSUE_CODES.map((code) => ({ code, status: statuses[code] ?? "passed" }));

const lighthouse = (statuses: TStatuses = {}) =>
	LIGHTHOUSE_ISSUE_CODES.map((code) => ({ code, status: statuses[code] ?? "passed" }));

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
const LIGHTHOUSE = LIGHTHOUSE_ISSUE_CODES.length;

describe("summariseChecks", () => {
	it("leads with our checks in the order the backend sent them, each labelled from the catalogue", () => {
		const [first] = summarise({}).sections;

		expect(first.heading).toBeNull();
		expect(first.rows[0].cells.crawl).toEqual([
			{ code: "TITLE_MISSING", label: "Title is missing", status: "passed", reason: null },
		]);
		// A group stands where its first code would, and gathers the rest of its codes.
		expect(first.rows.map((row) => row.cells.crawl[0].code)).toEqual(
			ACTIVE_ISSUE_CODES.filter((code) => !GATHERED.includes(code)),
		);
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

	it("follows our rows with Lighthouse's own, SEO before accessibility, failures first", () => {
		const { sections } = summarise({
			lighthouse: lighthouse({ LH_TABINDEX: "failed", LH_HTTP_STATUS_CODE: "failed" }),
		});

		expect(sections.map(({ heading }) => heading)).toEqual([
			null,
			"Lighthouse · SEO",
			"Lighthouse · Accessibility",
		]);
		expect(sections[1].rows[0].cells.lighthouse[0].code).toBe("LH_HTTP_STATUS_CODE");
		expect(sections[2].rows[0].cells.lighthouse[0].code).toBe("LH_TABINDEX");
		for (const row of sections[2].rows) {
			expect(row.cells.crawl).toEqual([]);
			const code = row.cells.lighthouse[0].code as keyof typeof LIGHTHOUSE_CATALOGUE;
			expect(LIGHTHOUSE_CATALOGUE[code].weights).not.toHaveProperty("seo");
		}
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
		expect(rowWith(summary, "LH_DOCUMENT_TITLE")?.disagree).toBe(false);
		expect(rowWith(summary, "LH_TABINDEX")?.disagree).toBe(false);
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
			lighthouse: lighthouse({ LH_BYPASS: "notApplicable", LH_TABINDEX: "notYetChecked" }),
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
			lighthouse: lighthouse({ LH_DOCUMENT_TITLE: "failed", LH_TABINDEX: "failed" }),
		});

		expect(failed).toBe(3);
	});

	it("gives each owner's skipped and unrecorded checks their own reason", () => {
		const summary = summarise({
			crawl: crawl({ IMAGES_MISSING_ALT: "notApplicable", LANG_MISSING: "notYetChecked" }),
			lighthouse: lighthouse({ LH_BYPASS: "notApplicable", LH_TABINDEX: "notYetChecked" }),
		});
		const reason = (code: string) => {
			const row = rowWith(summary, code)!;
			return [...row.cells.crawl, ...row.cells.lighthouse].find((cell) => cell.code === code)
				?.reason;
		};

		expect(reason("IMAGES_MISSING_ALT")).toBe("The page has no images.");
		expect(reason("LANG_MISSING")).toBe("Added after this page was last crawled.");
		expect(reason("LH_BYPASS")).toBe("Lighthouse found nothing on the page for this audit.");
		expect(reason("LH_TABINDEX")).toBe("Lighthouse did not report this audit in its last run.");
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
		expect(summary.sections.map(({ heading }) => heading)).toEqual([null]);
		expect(rowWith(summary, "CANONICAL_RELATIVE")?.cells.lighthouse).toEqual([]);
	});

	it("asks for a re-crawl when the crawl recorded nothing, and keeps Lighthouse's rows", () => {
		const summary = summarise({ crawl: null });

		expect(summary.columns.crawl.empty).toBe("Re-crawl this page to see each check.");
		expect(rowWith(summary, "LH_CANONICAL")?.cells.crawl).toEqual([]);
		expect(rowWith(summary, "THIN_CONTENT")).toBeUndefined();
	});
});
