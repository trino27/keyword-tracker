import { describe, expect, it } from "vitest";
import { SEO_ISSUE_CODES } from "@app/contracts";
import type { TPageCheck } from "@Gateways/PageGateway/Validation/PageSchemas";
import { summariseChecks } from "./summariseChecks";

const allPassing = (): TPageCheck[] =>
	SEO_ISSUE_CODES.map((code) => ({ code, status: "passed" as const }));

const withStatus = (code: string, status: TPageCheck["status"]): TPageCheck[] =>
	allPassing().map((check) => (check.code === code ? { ...check, status } : check));

/**
 * Counted from the catalogue rather than written in: the subtitle is about how many
 * checks there are, and a test that hard-codes the number fails on the next check
 * added without anything being wrong.
 */
const ALL = SEO_ISSUE_CODES.length;

describe("summariseChecks", () => {
	it("keeps the order it was given", () => {
		expect(summariseChecks(allPassing()).rows.map((row) => row.code)).toEqual(SEO_ISSUE_CODES);
	});

	it("labels each row from the catalogue", () => {
		const row = summariseChecks(allPassing()).rows[0];

		expect(row.label).toBe("Title is missing");
	});

	/** A failed check is still judged: the denominator is what the subtitle explains. */
	it("counts a failed check as judged", () => {
		const summary = summariseChecks(withStatus("TITLE_LENGTH", "failed"));

		expect(summary.subtitle).toBe(`${ALL} judged`);
		expect(summary.failed).toBe(1);
	});

	it("names only the groups that are not empty", () => {
		expect(summariseChecks(allPassing()).subtitle).toBe(`${ALL} judged`);
		expect(summariseChecks(withStatus("HEADING_SKIP", "notApplicable")).subtitle).toBe(
			`${ALL - 1} judged · 1 not applicable`,
		);
	});

	it("quotes the catalogue's reason for a skipped check", () => {
		const rows = summariseChecks(withStatus("IMAGES_MISSING_ALT", "notApplicable")).rows;

		expect(rows.find((row) => row.code === "IMAGES_MISSING_ALT")?.reason).toBe(
			"The page has no images.",
		);
	});

	it("explains a check the crawl never saw", () => {
		const rows = summariseChecks(withStatus("NOT_HTTPS", "notYetChecked")).rows;

		expect(rows.find((row) => row.code === "NOT_HTTPS")?.reason).toBe(
			"Added after this page was last crawled.",
		);
	});

	it("gives a judged check no reason to explain away", () => {
		expect(summariseChecks(allPassing()).rows.every((row) => row.reason === null)).toBe(true);
	});
});

describe("summariseChecks subtitle", () => {
	/**
	 * The three-group case, which the two-group tests above cannot reach: the order of
	 * the parts and the "not yet checked" noun are only pinned here.
	 */
	it("orders the groups judged, not applicable, not yet checked", () => {
		const checks = SEO_ISSUE_CODES.map((code, i) => ({
			code,
			status:
				i === 0
					? ("failed" as const)
					: i === 1
						? ("notApplicable" as const)
						: i === 2
							? ("notYetChecked" as const)
							: ("passed" as const),
		}));

		expect(summariseChecks(checks).subtitle).toBe(
			`${ALL - 2} judged · 1 not applicable · 1 not yet checked`,
		);
	});

	it("counts every status, not only the ones it names", () => {
		const checks = SEO_ISSUE_CODES.map((code, i) => ({
			code,
			status: i === 0 ? ("failed" as const) : ("passed" as const),
		}));

		expect(summariseChecks(checks).counts).toEqual({
			passed: ALL - 1,
			failed: 1,
			notApplicable: 0,
			notYetChecked: 0,
		});
	});
});
