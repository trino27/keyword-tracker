import { z } from "zod";
import type { IPositionFillResult } from "@app/contracts";

export const positionFillResultSchema = z.object({
	pairs: z.number().int(),
	added: z.number().int(),
}) satisfies z.ZodType<IPositionFillResult>;

export type TPositionFillResult = z.infer<typeof positionFillResultSchema>;
