import { Alert, Button, Group, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface ISectionErrorProps {
	title?: string;
	message: string;
	onRetry?: () => void;
}

/** A failed read, shown where the data would have been, with a way to try again. */
export function SectionError({
	title = "Could not load this",
	message,
	onRetry,
}: ISectionErrorProps) {
	return (
		<Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />} title={title}>
			<Group justify="space-between" align="center" gap="sm">
				<Text size="sm">{message}</Text>
				{onRetry && (
					<Button size="xs" variant="white" color="red" onClick={onRetry}>
						Try again
					</Button>
				)}
			</Group>
		</Alert>
	);
}
