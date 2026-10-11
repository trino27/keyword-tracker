import { z } from "zod";
import {
	CHECK_STATUSES,
	CRAWL_ISSUE_CODES,
	CWV_BANDS,
	CWV_SOURCES,
	LCP_PHASES,
	LIGHTHOUSE_ISSUE_CODES,
	PAGE_SPEED_AVAILABILITY_STATES,
	PAGE_SPEED_ERROR_CODES,
	PAGE_SPEED_STATUSES,
	MEASURED_ISSUE_CODES,
	CWV_CODES,
	SEO_ISSUE_SEVERITIES,
	type IBestPosition,
	type IKeywordPosition,
	type IPageCheck,
	type TChecksByOwner,
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
	type TLighthouseIssueCode,
	type TPageSpeedErrorCode,
	type TMeasuredIssueCode,
	type IImageDeliveryMeasurement,
	type TCwvSeoIssue,
	type TPsiStrategy,
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

const ownerCountsSchema = z.object({
	applicable: z.number().int().min(0),
	failed: z.number().int().min(0),
	pointsPossible: z.number().int().min(0),
	pointsLost: z.number().int().min(0),
});

/** A score, the counts and points it came from (neither denominator ever zero), and whose. */
export const pageScoreSchema = z.object({
	value: z.number().int().min(0).max(100),
	applicable: z.number().int().positive(),
	failed: z.number().int().min(0),
	pointsPossible: z.number().int().positive(),
	pointsLost: z.number().int().min(0),
	byOwner: z.object({
		crawl: ownerCountsSchema.nullable(),
		lighthouse: ownerCountsSchema.nullable(),
	}),
}) satisfies z.ZodType<IPageScore>;

/**
 * One check of one owner and what that owner last concluded. An unknown status — or a
 * code of another owner — is contract drift, a parse error, not a row rendered with no
 * marker: the same stance the issue union takes on an unknown code.
 */
const pageCheckSchemaOf = <C extends string>(codes: readonly C[]) =>
	z.object({
		code: z.enum([...codes] as [C, ...C[]]),
		status: z.enum(CHECK_STATUSES),
	});

export const pageCheckSchema = pageCheckSchemaOf(CRAWL_ISSUE_CODES) satisfies z.ZodType<
	IPageCheck<"crawl">
>;

/** Each scored owner's checks, each with its own null (lighthouse-checks D12). */
export const checksByOwnerSchema = z.object({
	crawl: z.array(pageCheckSchema).nullable(),
	lighthouse: z.array(pageCheckSchemaOf(LIGHTHOUSE_ISSUE_CODES)).nullable(),
}) satisfies z.ZodType<TChecksByOwner>;

const visitShareSchema = z.object({
	good: z.number().min(0).max(1),
	poor: z.number().min(0).max(1),
});

/** One Core Web Vital: an unknown band or source is contract drift, not a grey badge. */
const cwvReadingSchema = z.object({
	value: z.number().min(0),
	band: z.enum(CWV_BANDS),
	source: z.enum(CWV_SOURCES),
	share: visitShareSchema.nullable(),
});

const lcpBreakdownSchema = z.object({
	element: z.object({ selector: z.string(), snippet: z.string() }).nullable(),
	phases: z.array(z.object({ phase: z.enum(LCP_PHASES), ms: z.number().min(0) })),
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
			ttfb: cwvReadingSchema.nullable(),
			lcpBreakdown: lcpBreakdownSchema.nullable(),
			seoScore: z.number().int().min(0).max(100).nullable(),
			accessibilityScore: z.number().int().min(0).max(100).nullable(),
		})
		.nullable(),
	lastError: z
		.enum(PAGE_SPEED_ERROR_CODES as [TPageSpeedErrorCode, ...TPageSpeedErrorCode[]])
		.nullable(),
}) satisfies z.ZodType<IPageSpeedSummary>;

/** Each device's summary; null for a device the page was never queued on. */
export const pageSpeedByStrategySchema = z.object({
	mobile: pageSpeedSummarySchema.nullable(),
	desktop: pageSpeedSummarySchema.nullable(),
}) satisfies z.ZodType<Record<TPsiStrategy, IPageSpeedSummary | null>>;

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

const speedVariants = CWV_CODES.map((code) =>
	z.object({
		code: z.literal(code),
		severity: z.enum(SEO_ISSUE_SEVERITIES),
		details: cwvMeasurementSchema,
	}),
);

/** Lighthouse's estimate of the bytes the page's images could lose, and up to ten of them. */
const imageDeliverySchema = measurementSchema.extend({
	min: z.number(),
	images: z.array(z.object({ url: z.string(), savingsBytes: z.number() })).max(10),
}) satisfies z.ZodType<IImageDeliveryMeasurement>;

const imageDeliveryVariant = z.object({
	code: z.literal("IMAGE_DELIVERY_INEFFICIENT"),
	severity: z.enum(SEO_ISSUE_SEVERITIES),
	details: imageDeliverySchema,
});

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

/** A Lighthouse finding: the verdict is the finding, so it carries no details of its own. */
const lighthouseVariantOf = <K extends TLighthouseIssueCode>(code: K) =>
	z.object({
		code: z.literal(code),
		severity: z.enum(SEO_ISSUE_SEVERITIES),
		details: plainDetailsSchema,
	});

/** One schema type per code, for the reason `TPlainVariant` gives. */
type TLighthouseVariant = {
	[K in TLighthouseIssueCode]: ReturnType<typeof lighthouseVariantOf<K>>;
}[TLighthouseIssueCode];

const lighthouseVariants = LIGHTHOUSE_ISSUE_CODES.map((code) =>
	lighthouseVariantOf(code),
) as TLighthouseVariant[];

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
	| typeof imageDeliveryVariant
	| (typeof plainVariants)[number]
	| (typeof lighthouseVariants)[number];

export const seoIssueSchema = z.discriminatedUnion("code", [
	...measuredVariants,
	...speedVariants,
	imageDeliveryVariant,
	...plainVariants,
	...lighthouseVariants,
] as [TIssueVariant, ...TIssueVariant[]]) satisfies z.ZodType<TContractSeoIssue>;

/**
 * A Core Web Vitals finding alone — what a report's whole-site row is. Image delivery is a
 * speed finding too, but a lab estimate about one page, and never a whole-site row.
 */
type TSpeedVariant = (typeof speedVariants)[number];
export const pageSpeedIssueSchema = z.discriminatedUnion(
	"code",
	speedVariants as [TSpeedVariant, ...TSpeedVariant[]],
) satisfies z.ZodType<TCwvSeoIssue>;

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
	checksByOwner: checksByOwnerSchema,
	issues: z.array(detailIssueSchema),
	lastCrawl: crawlRunSummarySchema.nullable(),
	pageSpeedByStrategy: pageSpeedByStrategySchema,
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
