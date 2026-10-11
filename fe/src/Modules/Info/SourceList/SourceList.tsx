import { Anchor, Badge, Group, List, Text } from "@mantine/core";
import type { ISeoIssueSource } from "@app/contracts";
import { guideSourceOf } from "@ViewModels/InfoGuideViewModel/Services/BuildCheckGuide/buildCheckGuide";

/** The pages a claim rests on, each with its publisher's host; an industry voice is marked as one. */
export function SourceList({ sources }: { sources: readonly ISeoIssueSource[] }) {
	return (
		<div>
			<Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
				Sources
			</Text>
			<List size="sm" spacing={2}>
				{sources.map(guideSourceOf).map((source) => (
					<List.Item key={source.url}>
						<Group gap={6} wrap="wrap">
							<Anchor href={source.url} target="_blank" rel="noreferrer" size="sm">
								{source.title}
							</Anchor>
							<Text span size="xs" c="dimmed">
								{source.host}
							</Text>
							{source.industry && (
								<Badge size="xs" variant="outline" color="gray">
									Industry source
								</Badge>
							)}
						</Group>
					</List.Item>
				))}
			</List>
		</div>
	);
}
