import { z } from "zod";
import {
	CRAWL_ITEM_STATUSES,
	CRAWL_RUN_STATUSES,
	CRAWL_TRIGGERS,
	type IClient,
	type ICrawlRunDetail,
	type ICrawlRunItem,
	type ICrawlRunSummary,
} from "@app/contracts";

export const crawlRunSummarySchema = z.object({
	id: z.number().int(),
	status: z.enum(CRAWL_RUN_STATUSES),
	trigger: z.enum(CRAWL_TRIGGERS),
	pagesFound: z.number().int(),
	pagesDone: z.number().int(),
	errorCode: z.string().nullable(),
	errorMessage: z.string().nullable(),
	createdAt: z.string(),
	startedAt: z.string().nullable(),
	finishedAt: z.string().nullable(),
}) satisfies z.ZodType<ICrawlRunSummary>;

export const clientSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	websiteUrl: z.string(),
	siteKey: z.string(),
	currentPageCount: z.number().int(),
	latestRun: crawlRunSummarySchema.nullable(),
	createdAt: z.string(),
}) satisfies z.ZodType<IClient>;

export const crawlRunItemSchema = z.object({
	sitemapPosition: z.number().int(),
	url: z.string(),
	status: z.enum(CRAWL_ITEM_STATUSES),
	reason: z.string().nullable(),
	httpStatus: z.number().int().nullable(),
	pageId: z.number().int().nullable(),
}) satisfies z.ZodType<ICrawlRunItem>;

export const crawlRunDetailSchema = crawlRunSummarySchema.extend({
	clientId: z.number().int(),
	sitemapUrl: z.string().nullable(),
	selectionReason: z.string().nullable(),
	items: z.array(crawlRunItemSchema),
}) satisfies z.ZodType<ICrawlRunDetail>;

export const clientListResponseSchema = z.object({ items: z.array(clientSchema) });
export const clientResponseSchema = z.object({ client: clientSchema });
export const runResponseSchema = z.object({ run: crawlRunSummarySchema });
export const runDetailResponseSchema = z.object({ run: crawlRunDetailSchema });

export type TClient = z.infer<typeof clientSchema>;
export type TCrawlRunSummary = z.infer<typeof crawlRunSummarySchema>;
export type TCrawlRunDetail = z.infer<typeof crawlRunDetailSchema>;
export type TCrawlRunItem = z.infer<typeof crawlRunItemSchema>;

/** Adding a client: the two refusals are answers the form shows on its URL field. */
export type TAddClientResult =
	| { kind: "created"; client: TClient }
	| { kind: "exists"; message: string }
	| { kind: "invalidUrl"; message: string };

export type TRecrawlResult = { kind: "queued"; run: TCrawlRunSummary } | { kind: "active" };
