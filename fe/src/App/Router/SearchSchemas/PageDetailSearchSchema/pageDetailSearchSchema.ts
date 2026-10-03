import { isIsoDay } from "@app/contracts";
import { z } from "zod";
import { RANGE_PRESETS } from "@ViewModels/PageDetailViewModel/Services/ResolveRange/resolveRange";

const isoDay = z.string().refine(isIsoDay).optional().catch(undefined);

/** The detail screen's view state, in the URL so a chart can be linked to as it is seen. */
export const pageDetailSearchSchema = z.object({
	range: z.enum(RANGE_PRESETS).default("30d").catch("30d"),
	from: isoDay,
	to: isoDay,
	view: z.enum(["chart", "table"]).default("chart").catch("chart"),
	/** Keyword ids switched off in the chart. */
	hidden: z.array(z.coerce.number().int()).optional().catch(undefined),
});

export type TPageDetailSearch = z.infer<typeof pageDetailSearchSchema>;
