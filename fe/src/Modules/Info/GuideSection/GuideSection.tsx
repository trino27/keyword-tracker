import { Paper, Stack, Title } from "@mantine/core";
import type { ISeoIssueSource } from "@app/contracts";
import type { ReactNode } from "react";
import { ANCHOR_ATTRIBUTE } from "../guideOutline";
import { SourceList } from "../SourceList/SourceList";
import styles from "../InfoScreen.module.scss";

interface IGuideSectionProps {
	section: { id: string; label: string };
	children: ReactNode;
	/** What the section's claims rest on; listed under it. */
	sources?: readonly ISeoIssueSource[];
}

/** One chapter of the guide: a linkable heading the side navigation follows, the text, its sources. */
export function GuideSection({ section, children, sources }: IGuideSectionProps) {
	return (
		<Paper component="section" withBorder radius="md" p="lg" aria-labelledby={section.id}>
			<Stack gap="sm">
				<Title
					order={3}
					id={section.id}
					className={styles.anchor}
					{...{ [ANCHOR_ATTRIBUTE]: "" }}
				>
					{section.label}
				</Title>
				<Stack gap="sm" className={styles.prose}>
					{children}
				</Stack>
				{sources && sources.length > 0 && <SourceList sources={sources} />}
			</Stack>
		</Paper>
	);
}
