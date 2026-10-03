import { Alert, Group, Loader, Progress, Stack, Text } from "@mantine/core";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import { CRAWL_POST_LIMIT } from "@app/contracts";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { AnchorLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { describeRunProgress } from "@ViewModels/CrawlStatusViewModel/Services/DescribeRunProgress/describeRunProgress";

interface ICrawlBannerProps {
	client: TClient | null;
}

/**
 * The filtered client's crawl, while it matters: running, partial or failed. A finished
 * crawl says nothing — its pages are the message.
 */
export function CrawlBanner({ client }: ICrawlBannerProps) {
	const run = client?.latestRun;
	if (!client || !run || run.status === "succeeded") return null;

	const { tone, text } = describeRunProgress(run, client.siteKey);
	if (tone === "active") {
		return (
			<Alert color="blue" variant="light" icon={<Loader size={16} />} role="status">
				<Stack gap={6}>
					<Text size="sm">{text}</Text>
					{run.status === "running" && run.pagesFound > 0 && (
						<Progress
							value={(run.pagesDone / CRAWL_POST_LIMIT) * 100}
							size="sm"
							animated
							aria-label="Crawl progress"
						/>
					)}
				</Stack>
			</Alert>
		);
	}

	const failed = tone === "failed";
	return (
		<Alert
			color={failed ? "red" : "yellow"}
			variant="light"
			icon={failed ? <IconAlertTriangle size={18} /> : <IconInfoCircle size={18} />}
			title={failed ? `The crawl of ${client.siteKey} failed` : "Partial crawl"}
		>
			<Group gap="xs">
				<Text size="sm">{text}</Text>
				<AnchorLink to="/clients" search={{ expanded: client.id }} size="sm">
					{failed ? "Open the run log and re-crawl" : "Open the run log"}
				</AnchorLink>
			</Group>
		</Alert>
	);
}
