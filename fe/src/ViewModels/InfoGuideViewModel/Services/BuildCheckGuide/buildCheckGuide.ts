import {
	ACTIVE_ISSUE_CODES,
	LIGHTHOUSE_ISSUE_CODES,
	INDUSTRY_SOURCE_HOSTS,
	PAGE_SPEED_ISSUE_CODES,
	RUN_ISSUE_CODES,
	SEO_ISSUE_CATALOGUE,
	SEO_ISSUE_SEVERITIES,
	SEVERITY_WEIGHT,
	SITE_CHECK_CATALOGUE,
	SITE_CHECK_CODES,
	skipReasonOf,
	type IPlainCopy,
	type ISeoIssueSource,
	type TSeoIssueSeverity,
	type TSiteCheckCode,
} from "@app/contracts";
import { CHECK_CRITERIA } from "../CheckCriteria/checkCriteria";
import { LIGHTHOUSE_COMPARISONS } from "../CheckCriteria/groups/lighthouse";
import {
	CHECK_TOPIC_OF,
	SCORED_LIGHTHOUSE_CODES,
	type TScoredLighthouseCode,
	CHECK_TOPICS,
	type TCheckPart,
	type TCheckTopicId,
	type TGuideCode,
} from "@Core/Constants/checkTopics";
import type { ICheckExample } from "../CheckCriteria/criteriaShape";

/**
 * What a check reads, which decides whether it counts in the page score: one page, the
 * whole crawl compared page with page, Google's speed measurement, or the site itself.
 */
export type TCheckScope = "page" | "run" | "lighthouse" | "speed" | "site";

/** What each scope means to the reader: what the check reads, and whether it moves the score. */
export const CHECK_SCOPE_COPY: Record<TCheckScope, { label: string; detail: string }> = {
	page: {
		label: "Per page",
		detail: "Judged on each crawled page by itself. Counts in the page's SEO score.",
	},
	run: {
		label: "Across the crawl",
		detail: "Judged by comparing the page with the other pages of the same crawl. Counts in the page's SEO score.",
	},
	lighthouse: {
		label: "Lighthouse audit",
		detail: "Lighthouse's own verdict, from the run inside Google's PageSpeed Insights measurement. Counts in the page's SEO score.",
	},
	speed: {
		label: "Google measurement",
		detail: "Written from Google's PageSpeed Insights measurement. Shown as an issue, never counted in the SEO score.",
	},
	site: {
		label: "Whole site",
		detail: "Judged once per crawl for the site — robots.txt, sitemap, host, home page. Not part of any page's score.",
	},
};

export interface IGuideSource extends ISeoIssueSource {
	host: string;
	/** An audit vendor's or agency's reading, not a search engine's or a standard's own word. */
	industry: boolean;
}

export interface ICheckComparison {
	/** The checks on the other side of the comparison. */
	with: { code: TGuideCode; label: string }[];
	text: string;
}

export interface ICheckGuideEntry {
	code: TGuideCode;
	scope: TCheckScope;
	severity: TSeoIssueSeverity;
	/** What the check is worth in the page score; null for the codes outside it. */
	points: number | null;
	label: string;
	plain: IPlainCopy;
	hint: string;
	explanation: string;
	sources: IGuideSource[];
	passes: string;
	fails: string;
	/** Why the check can be skipped — null for a check that always applies. */
	skipped: string | null;
	/** How the check differs from the other owner's check of the same thing, where there is one. */
	comparisons: ICheckComparison[];
	/** What a page gains when the check passes. What failing costs is `plain.why`. */
	ifPasses: string;
	example: ICheckExample;
	/** What the tracker's code does to reach its verdict. */
	howChecked: string;
	/** How a person confirms the verdict on the live site. */
	manualCheck: readonly string[];
}

export interface ICheckGuideTopic {
	id: TCheckTopicId;
	/** The tracker's own checks and Google's measurement, or Lighthouse's audits. */
	part: TCheckPart;
	title: string;
	intro: string;
	entries: ICheckGuideEntry[];
}

const isSiteCode = (code: TGuideCode): code is TSiteCheckCode => code in SITE_CHECK_CATALOGUE;

const scopeOf = (code: TGuideCode): TCheckScope => {
	if (isSiteCode(code)) return "site";
	if ((PAGE_SPEED_ISSUE_CODES as readonly string[]).includes(code)) return "speed";
	if ((LIGHTHOUSE_ISSUE_CODES as readonly string[]).includes(code)) return "lighthouse";
	if ((RUN_ISSUE_CODES as readonly string[]).includes(code)) return "run";
	return "page";
};

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** A source with its host, and whether it is an industry voice rather than a first party. */
export const guideSourceOf = (source: ISeoIssueSource): IGuideSource => {
	const host = hostOf(source.url);
	return {
		...source,
		host,
		industry: INDUSTRY_SOURCE_HOSTS.some(
			(industry) => host === industry || host.endsWith(`.${industry}`),
		),
	};
};

/** Lighthouse says when its own audit does not apply; the other owners name their reason. */
const LIGHTHOUSE_NOT_APPLICABLE =
	"Lighthouse reports the audit as not applicable: the page has nothing this audit examines (no images, no forms, no tables…).";

function skippedOf(code: TGuideCode, scope: TCheckScope): string | null {
	if (isSiteCode(code)) return SITE_CHECK_CATALOGUE[code].skipReason;
	if (scope === "lighthouse") return LIGHTHOUSE_NOT_APPLICABLE;
	return skipReasonOf(code);
}

const labelOf = (code: TGuideCode) =>
	isSiteCode(code) ? SITE_CHECK_CATALOGUE[code].label : SEO_ISSUE_CATALOGUE[code].label;

/**
 * How this check compares with the other owner's check of the same thing: on a Lighthouse
 * card, the comparison with ours; on one of ours, every Lighthouse audit compared with it.
 */
function comparisonsOf(code: TGuideCode): ICheckComparison[] {
	const own = LIGHTHOUSE_COMPARISONS[code as TScoredLighthouseCode];
	if (own)
		return [
			{
				with: own.ours.map((other) => ({ code: other, label: labelOf(other) })),
				text: own.text,
			},
		];
	return (
		Object.entries(LIGHTHOUSE_COMPARISONS) as [
			TScoredLighthouseCode,
			{ ours: readonly TGuideCode[]; text: string },
		][]
	)
		.filter(([, comparison]) => comparison.ours.includes(code))
		.map(([audit, comparison]) => ({
			with: [{ code: audit, label: labelOf(audit) }],
			text: comparison.text,
		}));
}

function entryOf(code: TGuideCode): ICheckGuideEntry {
	const scope = scopeOf(code);
	const entry = isSiteCode(code) ? SITE_CHECK_CATALOGUE[code] : SEO_ISSUE_CATALOGUE[code];
	const inScore = scope === "page" || scope === "run" || scope === "lighthouse";
	const criteria = CHECK_CRITERIA[code];
	return {
		code,
		scope,
		severity: entry.severity,
		points: inScore ? SEVERITY_WEIGHT[entry.severity] : null,
		label: entry.label,
		plain: entry.plain,
		hint: entry.hint,
		explanation: entry.explanation,
		sources: entry.sources.map(guideSourceOf),
		passes: criteria.passes,
		fails: criteria.fails,
		skipped: skippedOf(code, scope),
		comparisons: comparisonsOf(code),
		ifPasses: criteria.ifPasses,
		example: criteria.example,
		howChecked: criteria.howChecked,
		manualCheck: criteria.manualCheck,
	};
}

/**
 * Every check the tracker runs today — the active crawl checks, the speed findings and
 * the site checks — filed under its chapter, worst level first and catalogue order within
 * a level. A retired check is left out: no crawl runs it any more.
 */
export function buildCheckGuide(): ICheckGuideTopic[] {
	const codes: TGuideCode[] = [
		...ACTIVE_ISSUE_CODES,
		...SCORED_LIGHTHOUSE_CODES,
		...PAGE_SPEED_ISSUE_CODES,
		...SITE_CHECK_CODES,
	];
	const entries = codes.map(entryOf);
	return CHECK_TOPICS.map((topic) => ({
		...topic,
		entries: entries
			.filter((entry) => CHECK_TOPIC_OF[entry.code] === topic.id)
			.sort(
				(a, b) =>
					SEO_ISSUE_SEVERITIES.indexOf(a.severity) -
					SEO_ISSUE_SEVERITIES.indexOf(b.severity),
			),
	})).filter((topic) => topic.entries.length > 0);
}

export interface IScoreFacts {
	/** Checks a crawl runs on every page. */
	crawlChecks: number;
	/** Audits Lighthouse scores, from the PageSpeed measurement. */
	lighthouseChecks: number;
	/** Every scored check — the crawl's and Lighthouse's — by level. */
	bySeverity: Record<TSeoIssueSeverity, number>;
	/** The points a page would be judged out of if every scored check applied to it. */
	pointsIfAllApply: number;
	speedFindings: number;
	siteChecks: number;
}

/** The numbers behind the score's explanation, counted from the catalogues as they are today. */
export function scoreFactsOf(): IScoreFacts {
	const scored: TGuideCode[] = [...ACTIVE_ISSUE_CODES, ...SCORED_LIGHTHOUSE_CODES];
	const bySeverity = Object.fromEntries(
		SEO_ISSUE_SEVERITIES.map((severity) => [
			severity,
			scored.filter((code) => entryOf(code).severity === severity).length,
		]),
	) as Record<TSeoIssueSeverity, number>;
	return {
		crawlChecks: ACTIVE_ISSUE_CODES.length,
		lighthouseChecks: SCORED_LIGHTHOUSE_CODES.length,
		bySeverity,
		pointsIfAllApply: SEO_ISSUE_SEVERITIES.reduce(
			(sum, severity) => sum + bySeverity[severity] * SEVERITY_WEIGHT[severity],
			0,
		),
		speedFindings: PAGE_SPEED_ISSUE_CODES.length,
		siteChecks: SITE_CHECK_CODES.length,
	};
}

export interface IComparisonRow {
	audit: { code: TScoredLighthouseCode; label: string };
	ours: { code: TGuideCode; label: string }[];
	text: string;
}

/** Every Lighthouse audit that has a counterpart, or a near one, among the tracker's checks. */
export function lighthouseComparisonRows(): IComparisonRow[] {
	return (
		Object.entries(LIGHTHOUSE_COMPARISONS) as [
			TScoredLighthouseCode,
			{ ours: readonly TGuideCode[]; text: string },
		][]
	).map(([audit, comparison]) => ({
		audit: { code: audit, label: labelOf(audit) },
		ours: comparison.ours.map((code) => ({ code, label: labelOf(code) })),
		text: comparison.text,
	}));
}
