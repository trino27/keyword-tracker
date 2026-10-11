import {
	Accordion,
	Badge,
	Code,
	Group,
	List,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import {
	IconCheck,
	IconPlayerSkipForward,
	IconTrendingDown,
	IconTrendingUp,
	IconX,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { severityLabel } from "@Core/Constants/severityLabel";
import {
	CHECK_SCOPE_COPY,
	type ICheckGuideEntry,
} from "@ViewModels/InfoGuideViewModel/Services/BuildCheckGuide/buildCheckGuide";
import { checkAnchor } from "../guideOutline";
import { SourceList } from "../SourceList/SourceList";
import styles from "../InfoScreen.module.scss";

/**
 * One check, everything about it: its level and weight, when it passes, fails or is
 * skipped, what it costs in plain words, what to do, how it is decided, and who says so.
 */
export function CheckCard({ entry }: { entry: ICheckGuideEntry }) {
	const severity = severityLabel[entry.severity];
	const SeverityIcon = severity.icon;
	const scope = CHECK_SCOPE_COPY[entry.scope];
	return (
		<Accordion.Item value={entry.code} id={checkAnchor(entry.code)} className={styles.anchor}>
			<Accordion.Control>
				<Group gap="sm" wrap="nowrap" align="flex-start">
					<ThemeIcon color={severity.color} variant="light" size="md" radius="xl">
						<SeverityIcon size={16} />
					</ThemeIcon>
					<Stack gap={4} miw={0}>
						<Text fw={600} size="sm">
							{entry.label}
						</Text>
						<Group gap={6} wrap="wrap">
							<Badge color={severity.color} variant="light" size="sm">
								{severity.label}
							</Badge>
							<Tooltip label={scope.detail} multiline w={280} withArrow>
								<Badge color="indigo" variant="outline" size="sm">
									{scope.label}
								</Badge>
							</Tooltip>
							<Badge color="gray" variant="default" size="sm">
								{entry.points === null
									? "Not in score"
									: `${entry.points} pts in score`}
							</Badge>
							<Code fz="xs">{entry.code}</Code>
						</Group>
					</Stack>
				</Group>
			</Accordion.Control>
			<Accordion.Panel>
				<Stack gap="md">
					<Text size="sm" fw={600}>
						{entry.plain.what}
					</Text>

					<SimpleGrid cols={{ base: 1, md: entry.skipped ? 3 : 2 }} spacing="sm">
						<Verdict color="teal" icon={<IconCheck size={14} />} title="Passes when">
							{entry.passes}
						</Verdict>
						<Verdict color="red" icon={<IconX size={14} />} title="Fails when">
							{entry.fails}
						</Verdict>
						{entry.skipped && (
							<Verdict
								color="gray"
								icon={<IconPlayerSkipForward size={14} />}
								title="Skipped (not applicable) when"
							>
								{entry.skipped}
							</Verdict>
						)}
					</SimpleGrid>

					<SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
						<Verdict
							color="teal"
							icon={<IconTrendingUp size={14} />}
							title="If it passes"
						>
							{entry.ifPasses}
						</Verdict>
						<Verdict
							color="red"
							icon={<IconTrendingDown size={14} />}
							title="If it fails"
						>
							{entry.plain.why}
						</Verdict>
					</SimpleGrid>

					{entry.counterparts.length > 0 && (
						<Text size="xs" c="dimmed">
							Also read by:{" "}
							{entry.counterparts
								.map((other) => `${other.label} (${other.code})`)
								.join(", ")}{" "}
							— the same property checked independently, each counted on its own side.
						</Text>
					)}

					<Block title="What it should look like">
						<Example label="Correct" color="teal" code={entry.example.good} />
						{entry.example.bad && (
							<Example label="Fails the check" color="red" code={entry.example.bad} />
						)}
					</Block>

					<Block title="How the tracker checks it">
						<Text size="sm">{entry.howChecked}</Text>
						<Text size="xs" c="dimmed">
							{scope.detail}
						</Text>
					</Block>

					<Block title="How to check it yourself">
						<List type="ordered" size="sm" spacing={4}>
							{entry.manualCheck.map((step) => (
								<List.Item key={step}>{step}</List.Item>
							))}
						</List>
					</Block>

					<Block title="How to fix it">
						{entry.plain.fix && <Text size="sm">{entry.plain.fix}</Text>}
						<Text size="sm" c="dimmed">
							{entry.hint}
						</Text>
					</Block>

					<Block title="Why it matters — the details">
						<Text size="sm">{entry.explanation}</Text>
					</Block>

					<SourceList sources={entry.sources} />
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}

function Verdict({
	color,
	icon,
	title,
	children,
}: {
	color: string;
	icon: ReactNode;
	title: string;
	children: ReactNode;
}) {
	return (
		<Stack gap={4} className={styles.verdict} data-color={color}>
			<Group gap={6} wrap="nowrap">
				<ThemeIcon color={color} size={20} radius="xl" variant="light">
					{icon}
				</ThemeIcon>
				<Text size="xs" fw={700} c={color} tt="uppercase">
					{title}
				</Text>
			</Group>
			<Text size="sm">{children}</Text>
		</Stack>
	);
}

function Block({ title, children }: { title: string; children: ReactNode }) {
	return (
		<Stack gap={4}>
			<Text size="xs" fw={600} c="dimmed" tt="uppercase">
				{title}
			</Text>
			{children}
		</Stack>
	);
}

/** A snippet of markup, headers or a file, labelled as the version that passes or fails. */
function Example({ label, color, code }: { label: string; color: string; code: string }) {
	return (
		<Stack gap={2}>
			<Text size="xs" fw={600} c={color}>
				{label}
			</Text>
			<Code block className={styles.example} data-color={color}>
				{code}
			</Code>
		</Stack>
	);
}
