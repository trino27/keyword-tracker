import { z } from "zod";
import type { IHealthResponse } from "@app/contracts";

/** The wire shape is the contract's; the schema proves the server kept to it. */
export const HealthSchema = z.object({
	status: z.enum(["ok", "degraded"]),
	database: z.enum(["up", "down"]),
}) satisfies z.ZodType<IHealthResponse>;

export type THealth = z.infer<typeof HealthSchema>;
