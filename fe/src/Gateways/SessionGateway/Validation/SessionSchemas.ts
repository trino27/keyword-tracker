import { z } from "zod";
import type { ISessionUser } from "@app/contracts";

export const sessionUserSchema = z.object({
	id: z.number().int(),
	email: z.string(),
	timeZone: z.string(),
}) satisfies z.ZodType<ISessionUser>;

export const sessionResponseSchema = z.object({ user: sessionUserSchema });

export type TSessionUser = z.infer<typeof sessionUserSchema>;

/** A sign-in attempt: the two refusals are outcomes the form shows, not errors. */
export type TSignInResult =
	{ kind: "signedIn"; user: TSessionUser } | { kind: "invalid" } | { kind: "throttled" };
