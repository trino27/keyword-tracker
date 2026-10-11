import { z } from "zod";
import {
	SEO_ISSUE_SEVERITIES,
	SITE_CHECK_CODES,
	type IAllPagesLocation,
	type IClientIssueReport,
	type IPageLocation,
	type TCwvSeoIssue,
	type TReportIssue as TContractReportIssue,
	type TSeoIssue,
	type TSiteCheckCode,
} from "@app/contracts";
import {
	pageSpeedAvailabilitySchema,
	pageSpeedIssueSchema,
	seoIssueSchema,
} from "../../PageGateway/Validation/PageSchemas";

const pageLocationSchema = z.object({
	kind: z.literal("page"),
	page: z.object({ id: z.number().int(), url: z.string(), title: z.string().nullable() }),
});

const allPagesLocationSchema = z.object({
	kind: z.literal("allPages"),
	pageCount: z.number().int().positive(),
});

/**
 * A row of the report: a page finding, a whole-site speed finding, or a site check. An
 * unknown code or location is contract drift — a parse error, not a blank card.
 */
const pageRowSchema = z.intersection(
	seoIssueSchema,
	z.object({ location: pageLocationSchema }),
) satisfies z.ZodType<TSeoIssue & { location: IPageLocation }>;

const allPagesRowSchema = z.intersection(
	pageSpeedIssueSchema,
	z.object({ location: allPagesLocationSchema }),
) satisfies z.ZodType<TCwvSeoIssue & { location: IAllPagesLocation }>;

const siteRowSchema = z.object({
	code: z.enum(SITE_CHECK_CODES as [TSiteCheckCode, ...TSiteCheckCode[]]),
	severity: z.enum(SEO_ISSUE_SEVERITIES),
	details: z.record(z.string(), z.unknown()),
	location: z.object({ kind: z.literal("site") }),
}) satisfies z.ZodType<Extract<TContractReportIssue, { location: { kind: "site" } }>>;

/**
 * Each branch is checked against its contract type above; the union of the three is cast,
 * because TypeScript gives up expanding a union of 59 intersected variants — the same
 * limit the page schemas work around per code.
 */
export const reportIssueSchema = z.union([
	pageRowSchema,
	allPagesRowSchema,
	siteRowSchema,
]) as unknown as z.ZodType<TContractReportIssue>;

export const clientIssueReportSchema = z.object({
	client: z.object({ id: z.number().int(), name: z.string() }),
	generatedFrom: z.object({ runId: z.number().int(), finishedAt: z.string() }).nullable(),
	pageSpeedAvailability: pageSpeedAvailabilitySchema,
	currentPages: z.number().int().min(0),
	issues: z.array(reportIssueSchema),
}) satisfies z.ZodType<IClientIssueReport>;

export type TClientIssueReport = IClientIssueReport;
export type TReportIssue = TContractReportIssue;

/** A report, or the one refusal a reader can act on: the client is not theirs or gone. */
export type TIssueReportResult =
	{ kind: "report"; report: TClientIssueReport } | { kind: "notFound" };
