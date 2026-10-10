import { PAGE_SPEED_ISSUE_CODES, SITE_CHECK_CODES } from "@app/contracts";
import type { TReportCode } from "@Core/Helpers/IssueCopy/issueCopy";

export type TIssueType = "seo" | "speed" | "site";

/**
 * Which filter a code answers to: Google's speed measurements, the site's own setup, or
 * everything the crawl reads from a page. The five HTML speed-risk checks are SEO — read
 * from the code, not measured — so "Speed" shows only what Google measured (plan O4).
 */
export function issueTypeOf(code: TReportCode): TIssueType {
	if ((PAGE_SPEED_ISSUE_CODES as readonly string[]).includes(code)) return "speed";
	if ((SITE_CHECK_CODES as readonly string[]).includes(code)) return "site";
	return "seo";
}
