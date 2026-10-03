import { z } from "zod";
import {
	SEO_ISSUE_CODES,
	SEO_ISSUE_SEVERITIES,
	type IBestPosition,
	type IKeywordPosition,
	type IPageDetail,
	type IPageListItem,
	type IPageListResponse,
	type IPositionHistory,
	type ISeoIssue,
	isIsoDay,
	type TIsoDay,
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

/** An unknown issue code is contract drift — a parse error, not a blank cell. */
export const seoIssueSchema = z.object({
	code: z.enum(SEO_ISSUE_CODES as [TSeoIssueCode, ...TSeoIssueCode[]]),
	severity: z.enum(SEO_ISSUE_SEVERITIES),
	details: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<ISeoIssue>;

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
