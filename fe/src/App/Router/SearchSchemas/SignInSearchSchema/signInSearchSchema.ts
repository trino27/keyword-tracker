import { z } from "zod";

/** `?redirect=` — where to go after signing in; checked again by `safeRedirectPath`. */
export const signInSearchSchema = z.object({
	redirect: z.string().optional().catch(undefined),
});

export type TSignInSearch = z.infer<typeof signInSearchSchema>;
