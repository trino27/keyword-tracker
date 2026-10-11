import {
	SEO_ISSUE_CATALOGUE,
	SEO_ISSUE_SEVERITIES,
	type ISeoIssueSource,
	type TSeoIssueCode,
	type TSeoIssueSeverity,
} from "@app/contracts";
import type { TSeoIssue } from "@Gateways/PageGateway/Validation/PageSchemas";
import { describeIssue, urls } from "@Core/Helpers/DescribeIssue/describeIssue";

export interface IIssueView {
	code: TSeoIssueCode;
	label: string;
	/** What exactly is wrong on this page, from the issue's details. */
	detail: string;
	hint: string;
	/** Why the check exists, at length, and what Google does and does not do with it. */
	explanation: string;
	/** Where the explanation comes from, to open beside the finding. */
	sources: readonly ISeoIssueSource[];
	/**
	 * What the crawl found on this page that proves the finding — the markup, header or
	 * robots.txt rule as written. Empty for a finding stored before findings carried it.
	 */
	evidence: string[];
	/**
	 * How many of the client's current pages carry this code, this one included. 1 means
	 * it is this page's problem; more means the fix probably belongs in a template.
	 */
	pagesAffected: number;
	/**
	 * The other pages this finding is ABOUT — the ones sharing the keyword, the title
	 * or the description. Empty for every finding a page makes on its own.
	 *
	 * They are URLs rather than links into the tracker because the analysis names them
	 * before anything is stored: at the moment a run is judged the pages have no ids
	 * yet, so the URL is the only handle that exists.
	 */
	relatedUrls: string[];
}

export interface IIssueGroup {
	severity: TSeoIssueSeverity;
	issues: IIssueView[];
}

/** Issues by severity — errors first — each with its label, its sentence and the fix. */
export function groupIssues(issues: (TSeoIssue & { pagesAffected?: number })[]): IIssueGroup[] {
	return SEO_ISSUE_SEVERITIES.map((severity) => ({
		severity,
		issues: issues
			.filter((issue) => issue.severity === severity)
			.map((issue) => ({
				code: issue.code,
				label: SEO_ISSUE_CATALOGUE[issue.code].label,
				detail: describeIssue(issue.code, issue.details),
				hint: SEO_ISSUE_CATALOGUE[issue.code].hint,
				explanation: SEO_ISSUE_CATALOGUE[issue.code].explanation,
				sources: SEO_ISSUE_CATALOGUE[issue.code].sources,
				evidence: urls(issue.details as Record<string, unknown>, "evidence"),
				pagesAffected: issue.pagesAffected ?? 1,
				relatedUrls: urls(issue.details as Record<string, unknown>, "otherUrls"),
			})),
	})).filter((group) => group.issues.length > 0);
}
