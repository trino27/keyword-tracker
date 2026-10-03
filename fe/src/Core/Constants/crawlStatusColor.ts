import type { MantineColor } from "@mantine/core";
import type { TCrawlItemStatus, TCrawlRunStatus } from "@app/contracts";

/** One colour per run status, everywhere — the badge, the banner, the run log. */
export const crawlStatusColor: Record<TCrawlRunStatus, MantineColor> = {
	queued: "gray",
	running: "blue",
	succeeded: "teal",
	partial: "yellow",
	failed: "red",
};

export const crawlStatusLabel: Record<TCrawlRunStatus, string> = {
	queued: "Queued",
	running: "Crawling",
	succeeded: "Crawled",
	partial: "Partial",
	failed: "Failed",
};

/** One colour per run-log item status. */
export const crawlItemStatusColor: Record<TCrawlItemStatus, MantineColor> = {
	crawled: "teal",
	skipped_listing: "gray",
	skipped_robots: "orange",
	skipped_not_html: "gray",
	skipped_other_site: "gray",
	failed: "red",
};

export const crawlItemStatusLabel: Record<TCrawlItemStatus, string> = {
	crawled: "Crawled",
	skipped_listing: "Listing page",
	skipped_robots: "Blocked by robots.txt",
	skipped_not_html: "Not a page",
	skipped_other_site: "Other site",
	failed: "Failed",
};
