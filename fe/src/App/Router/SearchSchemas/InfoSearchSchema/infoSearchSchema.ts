import { z } from "zod";

/**
 * The guide's search in the URL, so a link can open it already narrowed to one check —
 * "/info?q=CANONICAL_MISSING". Each search replaces the history entry rather than adding
 * one, so the back button leaves the guide instead of stepping through every word typed.
 * A malformed value falls back to the whole guide.
 */
export const infoSearchSchema = z.object({
	q: z.string().trim().min(1).max(200).optional().catch(undefined),
});

export type TInfoSearch = z.infer<typeof infoSearchSchema>;
