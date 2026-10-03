import { CRAWL_POST_LIMIT, CRAWL_RUN_ERRORS, type TCrawlRunErrorCode } from "@app/contracts";
import type { TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";

export type TRunTone = "active" | "partial" | "failed" | "succeeded";

export interface IRunProgress {
	tone: TRunTone;
	text: string;
}

const isKnownError = (code: string | null): code is TCrawlRunErrorCode =>
	code !== null && code in CRAWL_RUN_ERRORS;

/** The banner's sentence for a run, in plain words. */
export function describeRunProgress(run: TCrawlRunSummary, siteKey: string): IRunProgress {
	switch (run.status) {
		case "queued":
			return {
				tone: "active",
				text: `The crawl of ${siteKey} is queued and starts shortly.`,
			};
		case "running":
			return {
				tone: "active",
				text:
					run.pagesFound === 0
						? `Looking for the blog sitemap of ${siteKey}…`
						: `Crawling ${siteKey} — ${run.pagesDone} of ${CRAWL_POST_LIMIT} pages`,
			};
		case "partial":
			return {
				tone: "partial",
				text: `Only ${run.pagesDone} of ${CRAWL_POST_LIMIT} posts on ${siteKey} could be crawled; the run log says why for each one.`,
			};
		case "failed":
			return {
				tone: "failed",
				text: isKnownError(run.errorCode)
					? CRAWL_RUN_ERRORS[run.errorCode].message
					: (run.errorMessage ?? "The crawl failed."),
			};
		case "succeeded":
			return { tone: "succeeded", text: `Crawled ${run.pagesDone} posts on ${siteKey}.` };
	}
}
