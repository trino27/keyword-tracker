import { z } from "zod";

/**
 * The guide's search in the URL, so a link can open it already narrowed to one check —
 * "/info?q=CANONICAL_MISSING" — and the back button undoes a search. A malformed value
 * falls back to the whole guide.
 */
export const infoSearchSchema = z.object({
	q: z.string().trim().min(1).max(200).optional().catch(undefined),
});

export type TInfoSearch = z.infer<typeof infoSearchSchema>;
