import { describe, expect, it } from "vitest";
import { CRAWL_ISSUE_CODES, PAGE_SPEED_ISSUE_CODES } from "@app/contracts";
import { pageCheckSchema, seoIssueSchema } from "./PageSchemas";

describe("seoIssueSchema", () => {
	it("parses a measured finding with its stored bounds", () => {
		const parsed = seoIssueSchema.parse({
			code: "TITLE_LENGTH",
			severity: "notice",
			details: { value: 72, min: 30, max: 60 },
		});

		expect(parsed).toEqual({
			code: "TITLE_LENGTH",
			severity: "notice",
			details: { value: 72, min: 30, max: 60 },
		});
	});

	it("parses a measured finding carrying only the bound it broke", () => {
		expect(() =>
			seoIssueSchema.parse({
				code: "THIN_CONTENT",
				severity: "warning",
				details: { value: 227, min: 300 },
			}),
		).not.toThrow();
	});

	it("refuses a measured finding with no value", () => {
		expect(() =>
			seoIssueSchema.parse({
				code: "TITLE_LENGTH",
				severity: "notice",
				details: { min: 30, max: 60 },
			}),
		).toThrow();
	});

	// A retired code reaching the browser is contract drift, not a blank cell.
	it("refuses an unknown code", () => {
		expect(() =>
			seoIssueSchema.parse({
				code: "SLOW_RESPONSE",
				severity: "notice",
				details: { value: 1_800, max: 1_500 },
			}),
		).toThrow();
	});

	it("parses a plain finding's details as they came", () => {
		const parsed = seoIssueSchema.parse({
			code: "STRUCTURED_DATA_MISSING",
			severity: "notice",
			details: { types: ["Organization"] },
		});

		expect(parsed.details).toEqual({ types: ["Organization"] });
	});

	it("parses a speed finding with its source; refuses one without", () => {
		const finding = {
			code: "CWV_LCP_POOR",
			severity: "warning",
			details: { value: 5200, max: 4000, source: "url" },
		};

		expect(seoIssueSchema.parse(finding).details).toEqual(finding.details);
		expect(
			seoIssueSchema.safeParse({ ...finding, details: { value: 5200, max: 4000 } }).success,
		).toBe(false);
		expect(
			seoIssueSchema.safeParse({ ...finding, details: { value: 5200, source: "guess" } })
				.success,
		).toBe(false);
	});
});

describe("pageCheckSchema", () => {
	it("accepts every crawl code with every status", () => {
		for (const code of CRAWL_ISSUE_CODES) {
			for (const status of ["passed", "failed", "notApplicable", "notYetChecked"]) {
				expect(pageCheckSchema.safeParse({ code, status }).success).toBe(true);
			}
		}
	});

	/**
	 * A status the frontend does not know is contract drift, and the detail screen fails
	 * loudly rather than rendering a row with no marker — the stance seoIssueSchema above
	 * already takes on an unknown code.
	 */
	it("refuses a status it does not know", () => {
		expect(pageCheckSchema.safeParse({ code: "NOT_HTTPS", status: "skipped" }).success).toBe(
			false,
		);
	});

	/** A speed finding is not a check; a check row for one is contract drift. */
	it("refuses a speed code", () => {
		for (const code of PAGE_SPEED_ISSUE_CODES) {
			expect(pageCheckSchema.safeParse({ code, status: "failed" }).success).toBe(false);
		}
	});

	it("refuses a code the catalogue does not have", () => {
		expect(pageCheckSchema.safeParse({ code: "MADE_UP", status: "passed" }).success).toBe(
			false,
		);
	});
});
