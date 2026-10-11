import { Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface IGuidePartProps {
	title: string;
	/** One line on what the part is for. */
	lead?: string;
	children: ReactNode;
}

/** One part of the guide: a heading and a line on what it covers, over its chapters. */
export function GuidePart({ title, lead, children }: IGuidePartProps) {
	return (
		<Stack gap="md">
			<Stack gap={2}>
				<Title order={2} size="h3">
					{title}
				</Title>
				{lead && (
					<Text size="sm" c="dimmed">
						{lead}
					</Text>
				)}
			</Stack>
			{children}
		</Stack>
	);
}
