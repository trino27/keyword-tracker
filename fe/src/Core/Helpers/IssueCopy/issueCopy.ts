import {
	SEO_ISSUE_CATALOGUE,
	SEO_ISSUE_CODES,
	SITE_CHECK_CATALOGUE,
	SITE_CHECK_CODES,
	type IPlainCopy,
	type ISeoIssueSource,
	type TSeoIssueCode,
	type TSiteCheckCode,
} from "@app/contracts";

/** Any code a report row can carry: a page or speed finding, or a site check. */
export type TReportCode = TSeoIssueCode | TSiteCheckCode;

export interface IIssueCopy {
	/** The technical name, for Technical details. */
	label: string;
	/** What, why and fix, in a marketer's words. */
	plain: IPlainCopy;
	hint: string;
	explanation: string;
	sources: readonly ISeoIssueSource[];
}

const isSiteCode = (code: TReportCode): code is TSiteCheckCode => code in SITE_CHECK_CATALOGUE;

/** Every word a report card shows, from the catalogue that owns the code. */
export function issueCopyOf(code: TReportCode): IIssueCopy {
	const entry = isSiteCode(code) ? SITE_CHECK_CATALOGUE[code] : SEO_ISSUE_CATALOGUE[code];
	return {
		label: entry.label,
		plain: entry.plain,
		hint: entry.hint,
		explanation: entry.explanation,
		sources: entry.sources,
	};
}

const ORDER = new Map<string, number>(
	[...SEO_ISSUE_CODES, ...SITE_CHECK_CODES].map((code, index) => [code, index]),
);

/** Catalogue order: the tie-break when two issues weigh the same. */
export function catalogueOrderOf(code: TReportCode): number {
	return ORDER.get(code) ?? Number.MAX_SAFE_INTEGER;
}
