import { Alert, Button, Paper, Skeleton, Stack, Text, Title } from "@mantine/core";
import type { TIsoDay } from "@app/contracts";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import type { TLoadStatus } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import type {
	IDayRange,
	TRangePreset,
} from "@ViewModels/PageDetailViewModel/Services/ResolveRange/resolveRange";
import { KeywordToggles } from "./KeywordToggles/KeywordToggles";
import { KeywordTogglesSkeleton } from "./KeywordTogglesSkeleton/KeywordTogglesSkeleton";
import { PositionChart } from "./PositionChart/PositionChart";
import { PositionTable } from "./PositionTable/PositionTable";
import { RangeControls } from "./RangeControls/RangeControls";

interface IPositionHistoryProps {
	history: TPositionHistory | null;
	status: TLoadStatus;
	error: string | null;
	preset: TRangePreset;
	range: IDayRange;
	today: TIsoDay;
	view: "chart" | "table";
	hidden: number[];
	filling: boolean;
	fillError: string | null;
	onPreset: (preset: TRangePreset) => void;
	onCustom: (range: IDayRange) => void;
	onView: (view: "chart" | "table") => void;
	onToggle: (keywordId: number) => void;
	onRetry: () => void;
	onFill: () => void;
}

/** Where the page ranked over the chosen days, for each of its keywords. */
export function PositionHistory(props: IPositionHistoryProps) {
	const { history, status, error, view, hidden, filling, fillError, onRetry, onToggle, onFill } =
		props;
	const empty = history !== null && history.series.every((series) => series.points.length === 0);

	let body;
	if (status === "error" && error) {
		body = (
			<SectionError title="Could not load the history" message={error} onRetry={onRetry} />
		);
	} else if (!history) {
		body = <Skeleton height={360} radius="md" />;
	} else if (empty) {
		body = (
			<Paper withBorder radius="md" p="xl">
				<Stack gap="sm" align="center">
					<Text size="sm" c="dimmed" ta="center">
						No positions in this range. A page crawled after the last seed run has no
						history until the positions are generated.
					</Text>
					<Button size="xs" loading={filling} onClick={onFill}>
						Generate positions
					</Button>
				</Stack>
			</Paper>
		);
	} else {
		body =
			view === "chart" ? (
				<PositionChart history={history} hidden={hidden} />
			) : (
				<PositionTable history={history} />
			);
	}

	return (
		<Stack gap="sm">
			<Title order={4}>Position history</Title>
			<RangeControls {...props} />
			{fillError && (
				<Alert color="red" variant="light" title="Could not generate positions">
					{fillError}
				</Alert>
			)}
			{/* The chips and the chart are one request: they load together and, while a
			    new range is fetched, they dim together. */}
			<div style={{ opacity: status === "loading" && history ? 0.6 : 1 }}>
				<Stack gap="sm">
					{status !== "error" && !history && <KeywordTogglesSkeleton />}
					{/* The chips are the chart's legend, so the table does without them — except
					    when there is no history at all: the page's keywords are worth seeing
					    before any position has been generated for them. */}
					{history && (view === "chart" || empty) && (
						<KeywordToggles
							series={history.series}
							hidden={hidden}
							onToggle={onToggle}
						/>
					)}
					{body}
				</Stack>
			</div>
		</Stack>
	);
}
