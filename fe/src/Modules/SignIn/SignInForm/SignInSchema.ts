import { z } from "zod";

/** Shape only; whether the pair is right is the server's answer. */
export const signInSchema = z.object({
	email: z.string().trim().pipe(z.email("Enter a valid email address")),
	password: z.string().min(1, "Enter your password"),
});

export type TSignInValues = z.input<typeof signInSchema>;
export type TSignInFieldErrors = Partial<Record<keyof TSignInValues, string>>;
