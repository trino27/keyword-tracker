import { describe, expect, it } from "vitest";
import { issueTypeOf } from "./issueTypeOf";

describe("issueTypeOf", () => {
	it("files Google's measurements under Speed", () => {
		expect(issueTypeOf("CWV_LCP_POOR")).toBe("speed");
	});

	it("files the site's own setup under Site", () => {
		expect(issueTypeOf("SOFT_404")).toBe("site");
	});

	/** O4: risks read from the HTML are not measurements, so they are not Speed. */
	it("files the HTML speed risks under SEO", () => {
		expect(issueTypeOf("RENDER_BLOCKING_SCRIPTS")).toBe("seo");
		expect(issueTypeOf("LCP_IMAGE_LAZY_LOADED")).toBe("seo");
	});

	it("files a page finding under SEO", () => {
		expect(issueTypeOf("TITLE_MISSING")).toBe("seo");
	});
});
