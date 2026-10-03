import { z } from "zod";

/** Which client's run log is open — in the URL, so a link can point at it. */
export const clientsSearchSchema = z.object({
	expanded: z.coerce.number().int().positive().optional().catch(undefined),
});

export type TClientsSearch = z.infer<typeof clientsSearchSchema>;
