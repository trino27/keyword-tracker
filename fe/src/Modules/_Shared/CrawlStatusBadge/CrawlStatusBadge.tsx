import { Badge, Loader } from "@mantine/core";
import type { TCrawlRunStatus } from "@app/contracts";
import { crawlStatusColor, crawlStatusLabel } from "@Core/Constants/crawlStatusColor";

interface ICrawlStatusBadgeProps {
	status: TCrawlRunStatus | null;
}

/** A crawl's status in one colour everywhere; "Never crawled" before the first run. */
export function CrawlStatusBadge({ status }: ICrawlStatusBadgeProps) {
	if (status === null) {
		return (
			<Badge color="gray" variant="outline">
				Never crawled
			</Badge>
		);
	}
	const active = status === "queued" || status === "running";
	return (
		<Badge
			color={crawlStatusColor[status]}
			variant="light"
			leftSection={active ? <Loader size={10} color={crawlStatusColor[status]} /> : undefined}
		>
			{crawlStatusLabel[status]}
		</Badge>
	);
}
