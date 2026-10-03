import { Container } from "@mantine/core";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { describeError } from "@Core/Helpers/DescribeError/describeError";
import { SectionError } from "../SectionError/SectionError";

/** A route that could not load (a guard or a loader threw): the reason, and a retry. */
export function RouteError({ error, reset }: ErrorComponentProps) {
	return (
		<Container size="sm" py="xl">
			<SectionError
				title="Something went wrong"
				message={describeError(error)}
				onRetry={() => {
					reset();
					window.location.reload();
				}}
			/>
		</Container>
	);
}
