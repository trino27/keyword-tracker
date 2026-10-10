import { z } from "zod";
import {
	CHECK_STATUSES,
	CRAWL_ISSUE_CODES,
	CWV_BANDS,
	CWV_SOURCES,
	PAGE_SPEED_AVAILABILITY_STATES,
	PAGE_SPEED_ERROR_CODES,
	PAGE_SPEED_STATUSES,
	MEASURED_ISSUE_CODES,
	PAGE_SPEED_ISSUE_CODES,
	SEO_ISSUE_SEVERITIES,
	type IBestPosition,
	type IKeywordPosition,
	type IPageCheck,
	type IPageDetail,
	type IPageListItem,
	type IPageListResponse,
	type IPageScore,
	type IPageSpeedAvailability,
	type IPageSpeedSummary,
	type IPositionHistory,
	isIsoDay,
	type TIsoDay,
	type TCrawlIssueCode,
	type TPageSpeedErrorCode,
	type TMeasuredIssueCode,
	type TPageSpeedSeoIssue as TContractPageSpeedSeoIssue,
	type TSeoIssue as TContractSeoIssue,
} from "@app/contracts";
import { crawlRunSummarySchema } from "../../ClientGateway/Validation/ClientSchemas";

export const keywordPositionSchema = z.object({
	keywordId: z.number().int(),
	term: z.string(),
	relevance: z.number(),
	latestPosition: z.number().int().nullable(),
	latestCapturedAt: z.string().nullable(),
}) satisfies z.ZodType<IKeywordPosition>;

export const bestPositionSchema = z.object({
	position: z.number().int(),
	keywordId: z.number().int(),
	term: z.string(),
	capturedAt: z.string(),
}) satisfies z.ZodType<IBestPosition>;

/** A score and the denominator it came from; the denominator is never zero. */
export const pageScoreSchema = z.object({
	value: z.number().int().min(0).max(100),
	applicable: z.number().int().positive(),
	failed: z.number().int().min(0),
}) satisfies z.ZodType<IPageScore>;

/**
 * One catalogue check and what the last crawl concluded. An unknown status is contract
 * drift — a parse error, not a row rendered with no marker — the same stance the issue
 * union takes on an unknown code.
 */
export const pageCheckSchema = z.object({
	code: z.enum([...CRAWL_ISSUE_CODES] as [TCrawlIssueCode, ...TCrawlIssueCode[]]),
	status: z.enum(CHECK_STATUSES),
}) satisfies z.ZodType<IPageCheck>;

/** One Core Web Vital: an unknown band or source is contract drift, not a grey badge. */
const cwvReadingSchema = z.object({
	value: z.number().min(0),
	band: z.enum(CWV_BANDS),
	source: z.enum(CWV_SOURCES),
});

export const pageSpeedSummarySchema = z.object({
	status: z.enum(PAGE_SPEED_STATUSES),
	measurement: z
		.object({
			measuredAt: z.string(),
			lcp: cwvReadingSchema,
			inp: cwvReadingSchema.nullable(),
			cls: cwvReadingSchema,
			performanceScore: z.number().int().min(0).max(100),
		})
		.nullable(),
	lastError: z
		.enum(PAGE_SPEED_ERROR_CODES as [TPageSpeedErrorCode, ...TPageSpeedErrorCode[]])
		.nullable(),
}) satisfies z.ZodType<IPageSpeedSummary>;

export const pageSpeedAvailabilitySchema = z.object({
	state: z.enum(PAGE_SPEED_AVAILABILITY_STATES),
}) satisfies z.ZodType<IPageSpeedAvailability>;

export const pageListItemSchema = z.object({
	id: z.number().int(),
	url: z.string(),
	title: z.string().nullable(),
	client: z.object({ id: z.number().int(), name: z.string() }),
	keywords: z.array(keywordPositionSchema),
	bestPosition: bestPositionSchema.nullable(),
	score: pageScoreSchema,
	issues: z.object({
		total: z.number().int(),
		error: z.number().int(),
		warning: z.number().int(),
		notice: z.number().int(),
		siteWide: z.number().int().min(0),
	}),
	pageSpeed: pageSpeedSummarySchema.nullable(),
	lastCapturedAt: z.string().nullable(),
}) satisfies z.ZodType<IPageListItem>;

export const pageListResponseSchema = z.object({
	items: z.array(pageListItemSchema),
	page: z.number().int(),
	pageSize: z.number().int(),
	total: z.number().int(),
	pageSpeedAvailability: pageSpeedAvailabilitySchema,
}) satisfies z.ZodType<IPageListResponse>;

/** A threshold finding: the value as found, and the bounds the crawl judged it against. */
const measurementSchema = z.object({
	value: z.number(),
	min: z.number().optional(),
	max: z.number().optional(),
	evidence: z.array(z.string()).optional(),
});

/** A speed finding: the value Google reported, the bound it crossed, and whose it is. */
const cwvMeasurementSchema = measurementSchema.extend({ source: z.enum(CWV_SOURCES) });

const plainDetailsSchema = z.record(z.string(), z.unknown());

const isMeasured = (code: TCrawlIssueCode): code is TMeasuredIssueCode =>
	(MEASURED_ISSUE_CODES as readonly TCrawlIssueCode[]).includes(code);

const speedVariants = PAGE_SPEED_ISSUE_CODES.map((code) =>
	z.object({
		code: z.literal(code),
		severity: z.enum(SEO_ISSUE_SEVERITIES),
		details: cwvMeasurementSchema,
	}),
);

const measuredVariants = MEASURED_ISSUE_CODES.map((code) =>
	z.object({
		code: z.literal(code),
		severity: z.enum(SEO_ISSUE_SEVERITIES),
		details: measurementSchema,
	}),
);

type TPlainIssueCode = Exclude<TCrawlIssueCode, TMeasuredIssueCode>;

const plainVariantOf = <K extends TPlainIssueCode>(code: K) =>
	z.object({
		code: z.literal(code),
		severity: z.enum(SEO_ISSUE_SEVERITIES),
		details: plainDetailsSchema,
	});

/**
 * One schema TYPE per code, not one schema typed by the union of codes. The difference
 * is invisible until the catalogue passes 25 plain codes: TypeScript compares an object
 * whose `code` is a union against a union of objects by expanding it, and gives up at 25
 * — so `satisfies` below stopped compiling the day the 26th check was added.
 */
type TPlainVariant = {
	[K in TPlainIssueCode]: ReturnType<typeof plainVariantOf<K>>;
}[TPlainIssueCode];

const plainVariants = CRAWL_ISSUE_CODES.filter(
	(code): code is TPlainIssueCode => !isMeasured(code),
).map((code) => plainVariantOf(code)) as TPlainVariant[];

/**
 * One variant per catalogued code, the measured ones parsed as a measurement and the
 * speed ones as a measurement with its source. Built by mapping the catalogue, so a code
 * added or retired without its validator cannot drift. An unknown code is contract drift
 * — a parse error, not a blank cell — and so is a threshold finding that arrives without
 * the value it is supposed to carry, or a speed finding without its source.
 */
type TIssueVariant =
	| (typeof measuredVariants)[number]
	| (typeof speedVariants)[number]
	| (typeof plainVariants)[number];

export const seoIssueSchema = z.discriminatedUnion("code", [
	...measuredVariants,
	...speedVariants,
	...plainVariants,
] as [TIssueVariant, ...TIssueVariant[]]) satisfies z.ZodType<TContractSeoIssue>;

/** A speed finding alone — what a report's whole-site row is. */
type TSpeedVariant = (typeof speedVariants)[number];
export const pageSpeedIssueSchema = z.discriminatedUnion(
	"code",
	speedVariants as [TSpeedVariant, ...TSpeedVariant[]],
) satisfies z.ZodType<TContractPageSpeedSeoIssue>;

/** The detail's issues carry the spread; the list's issue counts carry a total instead. */
export const detailIssueSchema = z.intersection(
	seoIssueSchema,
	z.object({ pagesAffected: z.number().int().positive() }),
) satisfies z.ZodType<TContractSeoIssue & { pagesAffected: number }>;

export const pageDetailSchema = z.object({
	page: z.object({
		id: z.number().int(),
		url: z.string(),
		finalUrl: z.string(),
		title: z.string().nullable(),
		metaDescription: z.string().nullable(),
		h1: z.string().nullable(),
		lang: z.string().nullable(),
		wordCount: z.number().int(),
		httpStatus: z.number().int(),
		responseMs: z.number().int(),
		crawledAt: z.string(),
	}),
	client: z.object({
		id: z.number().int(),
		name: z.string(),
		websiteUrl: z.string(),
		currentPages: z.number().int().min(0),
	}),
	keywords: z.array(keywordPositionSchema),
	bestPosition: bestPositionSchema.nullable(),
	score: pageScoreSchema,
	/** Null while this page's last crawl predates per-check recording. */
	checks: z.array(pageCheckSchema).nullable(),
	issues: z.array(detailIssueSchema),
	lastCrawl: crawlRunSummarySchema.nullable(),
	pageSpeed: pageSpeedSummarySchema.nullable(),
	pageSpeedAvailability: pageSpeedAvailabilitySchema,
}) satisfies z.ZodType<IPageDetail>;

const isoDaySchema = z.custom<TIsoDay>((value) => typeof value === "string" && isIsoDay(value));

export const positionHistorySchema = z.object({
	from: isoDaySchema,
	to: isoDaySchema,
	timeZone: z.string(),
	series: z.array(
		z.object({
			keywordId: z.number().int(),
			term: z.string(),
			points: z.array(z.object({ capturedAt: z.string(), position: z.number().int() })),
		}),
	),
}) satisfies z.ZodType<IPositionHistory>;

export type TPageListItem = z.infer<typeof pageListItemSchema>;
export type TPageListResponse = z.infer<typeof pageListResponseSchema>;
export type TKeywordPosition = z.infer<typeof keywordPositionSchema>;
export type TPageDetail = z.infer<typeof pageDetailSchema>;
export type TPositionHistory = z.infer<typeof positionHistorySchema>;
export type TSeoIssue = z.infer<typeof seoIssueSchema>;
export type TDetailIssue = z.infer<typeof detailIssueSchema>;
export type TPageCheck = z.infer<typeof pageCheckSchema>;
export type TPageSpeedSummary = z.infer<typeof pageSpeedSummarySchema>;
export type TPageSpeedAvailability = z.infer<typeof pageSpeedAvailabilitySchema>;
export type TCwvReading = z.infer<typeof cwvReadingSchema>;
