import { z } from "zod";
import { SEO_ISSUE_SEVERITIES, type TSeoIssueSeverity } from "@app/contracts";
import { ISSUE_TYPES } from "@ViewModels/IssueReportViewModel/Services/FilterReport/filterReport";

/**
 * Every level by default: the report opens on everything found, and the reader narrows it.
 * (Planned as Critical and Important only, D9; the user asked for all — plan D30.)
 */
export const DEFAULT_LEVELS: TSeoIssueSeverity[] = ["error", "warning", "notice"];

/**
 * The report's state lives in the URL — the client, the page filter, the grouping and
 * the filters — so a link from a pages-list row opens the report already filtered, and a
 * report can be shared. A malformed value falls back to its default.
 */
export const issuesSearchSchema = z.object({
	clientId: z.coerce.number().int().positive().optional().catch(undefined),
	pageId: z.coerce.number().int().positive().optional().catch(undefined),
	group: z.enum(["issue", "page"]).default("issue").catch("issue"),
	levels: z.array(z.enum(SEO_ISSUE_SEVERITIES)).default(DEFAULT_LEVELS).catch(DEFAULT_LEVELS),
	type: z.enum(ISSUE_TYPES).default("all").catch("all"),
	q: z.string().trim().min(1).max(200).optional().catch(undefined),
});

export type TIssuesSearch = z.infer<typeof issuesSearchSchema>;
