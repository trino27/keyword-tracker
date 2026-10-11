import { Accordion, Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { ICheckGuideTopic } from "@ViewModels/InfoGuideViewModel/Services/BuildCheckGuide/buildCheckGuide";
import { CheckCard } from "../CheckCard/CheckCard";
import { ANCHOR_ATTRIBUTE, topicAnchor } from "../guideOutline";
import styles from "../InfoScreen.module.scss";

interface ICheckReferenceProps {
	topics: ICheckGuideTopic[];
	/** Open every card — a search result is read, not browsed. */
	expanded: boolean;
}

/** Every check, chapter by chapter, each card folded until the reader opens it. */
export function CheckReference({ topics, expanded }: ICheckReferenceProps) {
	return (
		<Stack gap="lg">
			{topics.map((topic) => (
				<Paper
					key={topic.id}
					component="section"
					withBorder
					radius="md"
					p="lg"
					aria-labelledby={topicAnchor(topic.id)}
				>
					<Stack gap="sm">
						<Group gap="sm">
							<Title
								order={3}
								id={topicAnchor(topic.id)}
								className={styles.anchor}
								{...{ [ANCHOR_ATTRIBUTE]: "" }}
							>
								{topic.title}
							</Title>
							<Badge variant="light" color="gray">
								{topic.entries.length}{" "}
								{topic.entries.length === 1 ? "check" : "checks"}
							</Badge>
						</Group>
						<Text size="sm" c="dimmed">
							{topic.intro}
						</Text>
						<Accordion
							multiple
							// A folded card renders only its header: ninety-odd mounted panels made the
							// guide the heaviest page in the app, and the search box finds what they hold.
							keepMounted={false}
							variant="separated"
							radius="md"
							defaultValue={expanded ? topic.entries.map((entry) => entry.code) : []}
						>
							{topic.entries.map((entry) => (
								<CheckCard key={entry.code} entry={entry} />
							))}
						</Accordion>
					</Stack>
				</Paper>
			))}
		</Stack>
	);
}
