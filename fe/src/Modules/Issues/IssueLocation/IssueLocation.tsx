import { Code, Group, Stack, Text } from "@mantine/core";
import { IconWorld } from "@tabler/icons-react";
import type { TSeoIssueCode } from "@app/contracts";
import { describeIssue, urls } from "@Core/Helpers/DescribeIssue/describeIssue";
import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { AnchorLink } from "@Modules/_Shared/RouterLink/RouterLink";

interface IIssueLocationProps {
	row: TReportIssue;
	/** In "By page" the page is already the heading; only the sentence is shown. */
	withPage?: boolean;
}

/**
 * Where one finding is, and what exactly was found there: the page as a link with the
 * finding's own sentence, or "Whole site" for a site check or Google's whole-site figures.
 */
export function IssueLocation({ row, withPage = true }: IIssueLocationProps) {
	const { location } = row;
	if (location.kind === "site") {
		const evidence = urls(row.details as Record<string, unknown>, "evidence");
		return (
			<Stack gap={4}>
				<Group gap={6}>
					<IconWorld size={14} />
					<Text size="sm" fw={500}>
						Whole site
					</Text>
				</Group>
				{evidence.slice(0, 5).map((quote) => (
					<Code
						key={quote}
						block
						style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
					>
						{quote}
					</Code>
				))}
			</Stack>
		);
	}
	// Past the site branch the code is a page or speed code; TypeScript does not narrow a
	// field of a union by its sibling, so it is said here once.
	const sentence = describeIssue(
		row.code as TSeoIssueCode,
		row.details as Record<string, unknown>,
	);
	if (location.kind === "allPages")
		return (
			<Stack gap={2}>
				<Group gap={6}>
					<IconWorld size={14} />
					<Text size="sm" fw={500}>
						Whole site ({location.pageCount} page{location.pageCount === 1 ? "" : "s"})
					</Text>
				</Group>
				<Text size="sm" c="dimmed">
					{sentence}
				</Text>
			</Stack>
		);
	return (
		<Stack gap={2}>
			{withPage && (
				<AnchorLink
					to="/pages/$pageId"
					params={{ pageId: String(location.page.id) }}
					size="sm"
					fw={500}
					lineClamp={1}
				>
					{location.page.title ?? location.page.url}
				</AnchorLink>
			)}
			<Text size="sm" c="dimmed">
				{sentence}
			</Text>
		</Stack>
	);
}
