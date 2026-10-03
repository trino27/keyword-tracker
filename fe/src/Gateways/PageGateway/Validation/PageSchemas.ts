import { z } from "zod";
import {
	MEASURED_ISSUE_CODES,
	SEO_ISSUE_CODES,
	SEO_ISSUE_SEVERITIES,
	type IBestPosition,
	type IKeywordPosition,
	type IPageDetail,
	type IPageListItem,
	type IPageListResponse,
	type IPositionHistory,
	isIsoDay,
	type TIsoDay,
	type TMeasuredIssueCode,
	type TSeoIssue as TContractSeoIssue,
	type TSeoIssueCode,
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

export const pageListItemSchema = z.object({
	id: z.number().int(),
	url: z.string(),
	title: z.string().nullable(),
	client: z.object({ id: z.number().int(), name: z.string() }),
	keywords: z.array(keywordPositionSchema),
	bestPosition: bestPositionSchema.nullable(),
	issues: z.object({
		total: z.number().int(),
		error: z.number().int(),
		warning: z.number().int(),
		notice: z.number().int(),
	}),
	lastCapturedAt: z.string().nullable(),
}) satisfies z.ZodType<IPageListItem>;

export const pageListResponseSchema = z.object({
	items: z.array(pageListItemSchema),
	page: z.number().int(),
	pageSize: z.number().int(),
	total: z.number().int(),
}) satisfies z.ZodType<IPageListResponse>;

/** A threshold finding: the value as found, and the bounds the crawl judged it against. */
const measurementSchema = z.object({
	value: z.number(),
	min: z.number().optional(),
	max: z.number().optional(),
});

const plainDetailsSchema = z.record(z.string(), z.unknown());

const isMeasured = (code: TSeoIssueCode): code is TMeasuredIssueCode =>
	(MEASURED_ISSUE_CODES as readonly TSeoIssueCode[]).includes(code);

const measuredVariants = MEASURED_ISSUE_CODES.map((code) =>
	z.object({
		code: z.literal(code),
		severity: z.enum(SEO_ISSUE_SEVERITIES),
		details: measurementSchema,
	}),
);

const plainVariants = SEO_ISSUE_CODES.filter((code) => !isMeasured(code)).map((code) =>
	z.object({
		code: z.literal(code),
		severity: z.enum(SEO_ISSUE_SEVERITIES),
		details: plainDetailsSchema,
	}),
);

/**
 * One variant per catalogued code, the measured ones parsed as a measurement. Built by
 * mapping the catalogue, so a code added or retired without its validator cannot drift.
 * An unknown code is contract drift — a parse error, not a blank cell — and so is a
 * threshold finding that arrives without the value it is supposed to carry.
 */
type TIssueVariant = (typeof measuredVariants)[number] | (typeof plainVariants)[number];

export const seoIssueSchema = z.discriminatedUnion("code", [
	...measuredVariants,
	...plainVariants,
] as [TIssueVariant, ...TIssueVariant[]]) satisfies z.ZodType<TContractSeoIssue>;

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
	client: z.object({ id: z.number().int(), name: z.string(), websiteUrl: z.string() }),
	keywords: z.array(keywordPositionSchema),
	bestPosition: bestPositionSchema.nullable(),
	issues: z.array(seoIssueSchema),
	lastCrawl: crawlRunSummarySchema.nullable(),
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
