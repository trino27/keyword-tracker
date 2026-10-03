import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SEARCH_LENGTH, PAGE_SIZE_OPTIONS } from "@app/contracts";

const pageSizes: readonly number[] = PAGE_SIZE_OPTIONS;

/**
 * The pages list's state lives in the URL — shareable, back-button safe. A malformed
 * value falls back to its default instead of breaking the screen.
 */
export const pagesSearchSchema = z.object({
	clientId: z.coerce.number().int().positive().optional().catch(undefined),
	q: z.string().trim().min(1).max(MAX_PAGE_SEARCH_LENGTH).optional().catch(undefined),
	page: z.coerce.number().int().min(1).default(1).catch(1),
	pageSize: z.coerce
		.number()
		.int()
		.refine((size) => pageSizes.includes(size))
		.default(DEFAULT_PAGE_SIZE)
		.catch(DEFAULT_PAGE_SIZE),
});

export type TPagesSearch = z.infer<typeof pagesSearchSchema>;
