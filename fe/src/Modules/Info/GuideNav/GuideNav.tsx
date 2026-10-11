import { Badge, NavLink, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import type { ICheckGuideTopic } from "@ViewModels/InfoGuideViewModel/Services/BuildCheckGuide/buildCheckGuide";
import { SearchInput } from "@Modules/_Shared/SearchInput/SearchInput";
import {
	CHECK_REFERENCE_TITLE,
	GUIDE_PARTS_AFTER_CHECKS,
	GUIDE_PARTS_BEFORE_CHECKS,
	GUIDE_SECTIONS,
	LIGHTHOUSE_TITLE,
	topicAnchor,
} from "../guideOutline";
import styles from "../InfoScreen.module.scss";

interface IGuideNavProps {
	/** The check reference's chapters on screen, with how many checks each holds. */
	reference: ICheckGuideTopic[];
	/** Lighthouse's chapters on screen. */
	lighthouse: ICheckGuideTopic[];
	/** False while a search shows only checks: the prose chapters are not on screen to jump to. */
	withChapters: boolean;
	activeId: string | null;
	onJump: (id: string) => void;
	query: string | undefined;
	onSearch: (q: string | undefined) => void;
}

/** The guide's table of contents: always in view, following the reader, one click to any chapter. */
export function GuideNav({
	reference,
	lighthouse,
	withChapters,
	activeId,
	onJump,
	query,
	onSearch,
}: IGuideNavProps) {
	const link = (id: string, label: string, right?: ReactNode) => (
		<NavLink
			key={id}
			href={`#${id}`}
			label={label}
			rightSection={right}
			active={activeId === id}
			variant="light"
			className={styles.navItem}
			onClick={(event) => {
				event.preventDefault();
				onJump(id);
			}}
		/>
	);
	const topicLink = (topic: ICheckGuideTopic) =>
		link(
			topicAnchor(topic.id),
			topic.title,
			<Badge size="xs" variant="light" color="gray">
				{topic.entries.length}
			</Badge>,
		);
	const part = (title: string, children: ReactNode) => (
		<Stack key={title} gap={0}>
			<Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" pt="sm" pb={4}>
				{title}
			</Text>
			{children}
		</Stack>
	);

	return (
		<Stack gap="xs">
			{/* Remounted when the URL's q changes from outside (e.g. "Show the whole guide"). */}
			<SearchInput
				key={query ?? ""}
				initial={query ?? ""}
				onCommit={onSearch}
				label="Search checks"
				placeholder="Search checks, e.g. canonical"
			/>
			<nav aria-label="Guide contents" className={styles.navScroll}>
				{withChapters &&
					GUIDE_PARTS_BEFORE_CHECKS.map((p) =>
						part(
							p.title,
							p.sections.map((section) => link(section.id, section.label)),
						),
					)}
				{reference.length > 0 &&
					part(
						CHECK_REFERENCE_TITLE,
						reference.map((topic) => topicLink(topic)),
					)}
				{(lighthouse.length > 0 || withChapters) &&
					part(LIGHTHOUSE_TITLE, [
						...(withChapters
							? [
									link(
										GUIDE_SECTIONS.lighthouseOverview.id,
										GUIDE_SECTIONS.lighthouseOverview.label,
									),
								]
							: []),
						...lighthouse.map((topic) => topicLink(topic)),
					])}
				{withChapters &&
					GUIDE_PARTS_AFTER_CHECKS.map((p) =>
						part(
							p.title,
							p.sections.map((section) => link(section.id, section.label)),
						),
					)}
			</nav>
		</Stack>
	);
}
