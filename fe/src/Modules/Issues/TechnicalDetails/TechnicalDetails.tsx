import { Anchor, Collapse, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import type { IIssueCopy } from "@Core/Helpers/IssueCopy/issueCopy";

/**
 * The precise, source-backed account — the catalogue's label, hint and explanation —
 * folded away under the marketer's copy, for whoever ends up fixing it.
 */
export function TechnicalDetails({ copy }: { copy: IIssueCopy }) {
	const [opened, { toggle }] = useDisclosure(false);
	return (
		<Stack gap={4}>
			<UnstyledButton onClick={toggle} aria-expanded={opened}>
				<Group gap={4}>
					{opened ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
					<Text size="xs" c="dimmed" fw={600}>
						Technical details
					</Text>
				</Group>
			</UnstyledButton>
			<Collapse expanded={opened}>
				<Stack gap={4} pl="md">
					<Text size="xs" fw={600}>
						{copy.label}
					</Text>
					<Text size="xs">{copy.hint}</Text>
					<Text size="xs" c="dimmed">
						{copy.explanation}
					</Text>
					<Group gap={6} wrap="wrap">
						<Text size="xs" c="dimmed">
							Source:
						</Text>
						{copy.sources.map((source) => (
							<Anchor
								key={source.url}
								href={source.url}
								target="_blank"
								rel="noreferrer"
								size="xs"
							>
								{source.title}
							</Anchor>
						))}
					</Group>
				</Stack>
			</Collapse>
		</Stack>
	);
}
