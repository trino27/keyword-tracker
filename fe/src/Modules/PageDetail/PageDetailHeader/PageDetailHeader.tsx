import { Anchor, Breadcrumbs, Group, Text, Tooltip } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";
import type { TPageDetail } from "@Gateways/PageGateway/Validation/PageSchemas";
import { PageHeader } from "@Modules/_Shared/PageHeader/PageHeader";
import { AnchorLink } from "@Modules/_Shared/RouterLink/RouterLink";

interface IPageDetailHeaderProps {
	detail: TPageDetail;
	timeZone: string;
}

/** Where the page lives, whose it is, and when it was last read. */
export function PageDetailHeader({ detail, timeZone }: IPageDetailHeaderProps) {
	const { page, client } = detail;
	return (
		<PageHeader
			breadcrumb={
				<Breadcrumbs separator="›" fz="sm">
					<AnchorLink to="/pages" size="sm">
						Pages
					</AnchorLink>
					<AnchorLink to="/pages" search={{ clientId: client.id }} size="sm">
						{client.name}
					</AnchorLink>
				</Breadcrumbs>
			}
			title={page.title ?? page.url}
			description={
				<Group gap="md" component="span" wrap="wrap">
					<Anchor href={page.finalUrl} target="_blank" rel="noreferrer" size="sm">
						<Group gap={4} component="span" wrap="nowrap">
							{page.url}
							<IconExternalLink size={14} />
						</Group>
					</Anchor>
					<Text span size="sm" c="dimmed">
						{page.wordCount.toLocaleString("en-US")} words · HTTP {page.httpStatus}
						{page.lang ? ` · ${page.lang}` : ""} ·{" "}
						{/* A fact of the crawl, never a verdict — the tooltip is the one place
						    the screen can say so. */}
						<Tooltip
							label="Time to first byte of one fetch from our crawler — not a field measurement of your visitors."
							multiline
							w={260}
							withArrow
						>
							<Text span size="sm" c="dimmed" style={{ cursor: "help" }}>
								{page.responseMs.toLocaleString("en-US")} ms to first byte
							</Text>
						</Tooltip>{" "}
						· crawled {formatInZone(page.crawledAt, timeZone, "dateTime")}
					</Text>
				</Group>
			}
		/>
	);
}
