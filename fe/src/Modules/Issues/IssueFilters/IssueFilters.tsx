import { Button, Chip, Group, SegmentedControl, Stack } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { SEO_ISSUE_SEVERITIES } from "@app/contracts";
import type { TIssuesSearch } from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import { severityLabel } from "@Core/Constants/severityLabel";
import { SearchInput } from "@Modules/_Shared/SearchInput/SearchInput";
import type { TIssueTypeFilter } from "@ViewModels/IssueReportViewModel/Services/FilterReport/filterReport";

interface IIssueFiltersProps {
	search: TIssuesSearch;
	/** The title of the page the report is filtered to, for the chip that clears it. */
	pageTitle: string | null;
	onChange: (change: Partial<TIssuesSearch>) => void;
}

const TYPE_OPTIONS: { value: TIssueTypeFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "seo", label: "SEO" },
	{ value: "speed", label: "Speed" },
	{ value: "site", label: "Site" },
];

/** Grouping and filters, all in the URL. */
export function IssueFilters({ search, pageTitle, onChange }: IIssueFiltersProps) {
	return (
		<Stack gap="sm">
			<Group gap="md" wrap="wrap" align="center">
				<SegmentedControl
					aria-label="Group by"
					value={search.group}
					onChange={(group) => onChange({ group: group })}
					data={[
						{ value: "issue", label: "By issue" },
						{ value: "page", label: "By page" },
					]}
				/>
				<Chip.Group
					multiple
					value={search.levels}
					onChange={(levels) =>
						onChange({
							levels: SEO_ISSUE_SEVERITIES.filter((severity) =>
								levels.includes(severity),
							),
						})
					}
				>
					<Group gap={6}>
						{SEO_ISSUE_SEVERITIES.map((severity) => (
							<Chip
								key={severity}
								value={severity}
								color={severityLabel[severity].color}
								size="sm"
							>
								{severityLabel[severity].label}
							</Chip>
						))}
					</Group>
				</Chip.Group>
				<SegmentedControl
					aria-label="Type"
					value={search.type}
					onChange={(type) => onChange({ type: type })}
					data={TYPE_OPTIONS}
				/>
				<SearchInput
					initial={search.q ?? ""}
					onCommit={(q) => onChange({ q })}
					label="Search issues by page"
					placeholder="Search by page URL or title"
				/>
			</Group>
			{search.pageId !== undefined && (
				<Group>
					<Button
						variant="light"
						size="xs"
						rightSection={<IconX size={14} />}
						onClick={() => onChange({ pageId: undefined })}
						aria-label={`Page: ${pageTitle ?? `#${search.pageId}`} — show every page`}
					>
						Page: {pageTitle ?? `#${search.pageId}`}
					</Button>
				</Group>
			)}
		</Stack>
	);
}
