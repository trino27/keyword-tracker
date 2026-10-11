import { describe, expect, it } from "vitest";
import {
	ACTIVE_ISSUE_CODES,
	ISSUE_COUNTERPARTS,
	PAGE_SPEED_ISSUE_CODES,
	SEO_ISSUE_CATALOGUE,
	SEO_ISSUE_SEVERITIES,
	SEVERITY_WEIGHT,
	SITE_CHECK_CODES,
} from "@app/contracts";
import { SCORED_LIGHTHOUSE_CODES } from "@Core/Constants/checkTopics";
import { buildCheckGuide, scoreFactsOf } from "./buildCheckGuide";

const entries = () => buildCheckGuide().flatMap((topic) => topic.entries);
const entryOf = (code: string) => entries().find((entry) => entry.code === code)!;

describe("buildCheckGuide", () => {
	it("explains every check the tracker runs, each exactly once", () => {
		const codes = entries().map((entry) => entry.code);
		expect([...codes].sort()).toEqual(
			[
				...ACTIVE_ISSUE_CODES,
				...SCORED_LIGHTHOUSE_CODES,
				...PAGE_SPEED_ISSUE_CODES,
				...SITE_CHECK_CODES,
			].sort(),
		);
		expect(new Set(codes).size).toBe(codes.length);
	});

	it("gives every check a rule to pass and a rule to fail", () => {
		for (const entry of entries()) {
			expect(entry.passes.length, entry.code).toBeGreaterThan(10);
			expect(entry.fails.length, entry.code).toBeGreaterThan(10);
		}
	});

	it("backs every check with a source, and says what passing gains and what failing costs", () => {
		for (const entry of entries()) {
			expect(entry.sources.length, entry.code).toBeGreaterThan(0);
			expect(entry.ifPasses.length, entry.code).toBeGreaterThan(20);
			expect(entry.plain.why.length, entry.code).toBeGreaterThan(20);
		}
	});

	it("shows every check an example, how the tracker decides, and how to check it by hand", () => {
		for (const entry of entries()) {
			expect(entry.example.good.trim().length, entry.code).toBeGreaterThan(0);
			expect(entry.example.bad ?? "x", entry.code).not.toBe(entry.example.good);
			expect(entry.howChecked.length, entry.code).toBeGreaterThan(40);
			expect(entry.manualCheck.length, entry.code).toBeGreaterThanOrEqual(2);
		}
	});

	it("quotes the catalogue's own bounds, so the guide and the check agree", () => {
		const { min, max } = SEO_ISSUE_CATALOGUE.TITLE_LENGTH;
		expect(entryOf("TITLE_LENGTH").fails).toContain(
			`shorter than ${min} or longer than ${max}`,
		);
		expect(entryOf("CWV_LCP_POOR").fails).toBe("LCP is above 4 s.");
	});

	it("weighs page and crawl-wide checks by level, and leaves speed and site out of the score", () => {
		expect(entryOf("NOINDEX")).toMatchObject({ scope: "page", points: SEVERITY_WEIGHT.error });
		expect(entryOf("TITLE_DUPLICATE")).toMatchObject({
			scope: "run",
			points: SEVERITY_WEIGHT.warning,
		});
		expect(entryOf("CWV_INP_POOR")).toMatchObject({ scope: "speed", points: null });
		expect(entryOf("SOFT_404")).toMatchObject({ scope: "site", points: null });
		expect(entryOf("LH_IMAGE_ALT")).toMatchObject({
			scope: "lighthouse",
			points: SEVERITY_WEIGHT[entryOf("LH_IMAGE_ALT").severity],
		});
	});

	it("names why a conditional check is skipped, and nothing for one that always applies", () => {
		expect(entryOf("IMAGES_MISSING_ALT").skipped).toBe("The page has no images.");
		expect(entryOf("TITLE_MISSING").skipped).toBeNull();
		expect(entryOf("ROBOTS_TXT_TRUNCATED").skipped).toBe(
			"The site answered no robots.txt to measure.",
		);
	});

	it("marks an industry source as one, and a first party as not", () => {
		const sources = entryOf("KEYWORD_CANNIBALISATION").sources;
		expect(sources.find((source) => source.host === "ahrefs.com")?.industry).toBe(true);
		expect(entryOf("TITLE_MISSING").sources.every((source) => !source.industry)).toBe(true);
	});

	it("compares a Lighthouse audit with our check of the same thing, on both cards", () => {
		const lighthouse = entryOf("LH_IMAGE_ALT").comparisons;
		expect(lighthouse.flatMap((c) => c.with.map((other) => other.code))).toEqual([
			"IMAGES_MISSING_ALT",
		]);
		const ours = entryOf("IMAGES_MISSING_ALT").comparisons;
		expect(ours.flatMap((c) => c.with.map((other) => other.code))).toEqual(["LH_IMAGE_ALT"]);
		expect(ours[0].text).toBe(lighthouse[0].text);
		expect(
			entryOf("LINKS_WITHOUT_TEXT").comparisons.flatMap((c) =>
				c.with.map((other) => other.code),
			),
		).toEqual(["LH_LINK_TEXT"]);
		expect(entryOf("THIN_CONTENT").comparisons).toEqual([]);
	});

	it("compares every scored Lighthouse audit that shares a row with one of ours", () => {
		for (const group of ISSUE_COUNTERPARTS)
			for (const audit of (group.lighthouse ?? []).filter((code) =>
				(SCORED_LIGHTHOUSE_CODES as readonly string[]).includes(code),
			))
				expect(entryOf(audit).comparisons.length, audit).toBeGreaterThan(0);
	});

	it("lists a chapter worst level first", () => {
		for (const topic of buildCheckGuide()) {
			const ranks = topic.entries.map((entry) =>
				SEO_ISSUE_SEVERITIES.indexOf(entry.severity),
			);
			expect(ranks, topic.id).toEqual([...ranks].sort((a, b) => a - b));
		}
	});
});

describe("scoreFactsOf", () => {
	it("counts the scored checks — the crawl's and Lighthouse's — by level, and what they would be worth", () => {
		const facts = scoreFactsOf();
		const { error, warning, notice } = facts.bySeverity;
		expect(facts.crawlChecks).toBe(ACTIVE_ISSUE_CODES.length);
		expect(facts.lighthouseChecks).toBe(SCORED_LIGHTHOUSE_CODES.length);
		expect(error + warning + notice).toBe(facts.crawlChecks + facts.lighthouseChecks);
		expect(facts.pointsIfAllApply).toBe(
			error * SEVERITY_WEIGHT.error +
				warning * SEVERITY_WEIGHT.warning +
				notice * SEVERITY_WEIGHT.notice,
		);
		expect(facts.speedFindings).toBe(PAGE_SPEED_ISSUE_CODES.length);
		expect(facts.siteChecks).toBe(SITE_CHECK_CODES.length);
	});
});
