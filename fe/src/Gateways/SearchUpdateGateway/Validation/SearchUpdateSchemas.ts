import { z } from "zod";
import {
	SEARCH_UPDATE_KINDS,
	type ISearchUpdate,
	type ISearchUpdatesResponse,
} from "@app/contracts";

export const searchUpdateSchema = z.object({
	id: z.string(),
	title: z.string(),
	kind: z.enum(SEARCH_UPDATE_KINDS),
	begin: z.string(),
	end: z.string().nullable(),
	url: z.string(),
}) satisfies z.ZodType<ISearchUpdate>;

export const searchUpdatesResponseSchema = z.object({
	updates: z.array(searchUpdateSchema),
	available: z.boolean(),
}) satisfies z.ZodType<ISearchUpdatesResponse>;

export type TSearchUpdate = z.infer<typeof searchUpdateSchema>;
export type TSearchUpdatesResponse = z.infer<typeof searchUpdatesResponseSchema>;
