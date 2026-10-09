import { Anchor, Group, Paper, Stack, Text } from "@mantine/core";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceArea,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import type { TSearchUpdate } from "@Gateways/SearchUpdateGateway/Validation/SearchUpdateSchemas";
import { placeSearchUpdates } from "@ViewModels/PageDetailViewModel/Services/PlaceSearchUpdates/placeSearchUpdates";
import {
	seriesKey,
	toChartRows,
} from "@ViewModels/PageDetailViewModel/Services/ToChartRows/toChartRows";
import { keywordColor } from "../../keywordColors";

interface IPositionChartProps {
	history: TPositionHistory;
	hidden: number[];
	searchUpdates: TSearchUpdate[];
	/** The user's today, where an update still rolling out ends. */
	today: string;
}

/** Core updates re-weigh everything, so they stand out; spam and other updates less. */
const UPDATE_COLOR: Record<TSearchUpdate["kind"], string> = {
	core: "var(--mantine-color-red-5)",
	spam: "var(--mantine-color-orange-5)",
	other: "var(--mantine-color-gray-5)",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-03" → "Oct 3" — the day is already the user's calendar day. */
const shortDay = (day: string) => {
	const [, month, date] = day.split("-").map(Number);
	return `${MONTHS[month - 1]} ${date}`;
};

/**
 * Positions over time with the axis inverted — position 1 at the top, as every rank
 * tracker draws it, so "up" means "better".
 */
export function PositionChart({ history, hidden, searchUpdates, today }: IPositionChartProps) {
	const rows = toChartRows(history);
	// Bands behind the lines: the first question of a drop is whether Google moved.
	const bands = placeSearchUpdates(
		rows.map(({ day }) => day),
		searchUpdates,
		history.timeZone,
		today,
	);
	const visible = history.series
		.map((series, index) => ({ series, index }))
		.filter(({ series }) => !hidden.includes(series.keywordId) && series.points.length > 0);

	return (
		<Stack gap="xs">
			<Paper withBorder radius="md" p="md" h={360}>
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" />
						{bands.map((band) => (
							<ReferenceArea
								key={band.id}
								x1={band.from}
								x2={band.to}
								fill={UPDATE_COLOR[band.kind]}
								fillOpacity={0.12}
								stroke="none"
								ifOverflow="hidden"
							/>
						))}
						<XAxis
							dataKey="day"
							tickFormatter={shortDay}
							tick={{ fontSize: 12 }}
							minTickGap={24}
						/>
						<YAxis
							reversed
							domain={[1, "dataMax"]}
							allowDecimals={false}
							tick={{ fontSize: 12 }}
							width={40}
						/>
						<Tooltip
							labelFormatter={(day) =>
								typeof day === "string" ? shortDay(day) : day
							}
							formatter={(value, name) => [`#${String(value)}`, name]}
						/>
						{visible.map(({ series, index }) => (
							<Line
								key={series.keywordId}
								type="monotone"
								dataKey={seriesKey(series.keywordId)}
								name={series.term}
								stroke={keywordColor(index)}
								strokeWidth={2}
								dot={false}
								connectNulls
								isAnimationActive={false}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</Paper>
			{bands.length > 0 && (
				<Group gap="xs" wrap="wrap" aria-label="Google updates in this range">
					<Text size="xs" c="dimmed">
						Google updates in this range:
					</Text>
					{bands.map((band) => (
						<Group key={band.id} gap={4} wrap="nowrap">
							<span
								aria-hidden
								style={{
									width: 10,
									height: 10,
									borderRadius: 2,
									background: UPDATE_COLOR[band.kind],
									opacity: 0.6,
								}}
							/>
							<Anchor href={band.url} target="_blank" rel="noreferrer" size="xs">
								{`${band.title} (${shortDay(band.began)}–${band.ongoing ? "ongoing" : shortDay(band.ended)})`}
							</Anchor>
						</Group>
					))}
				</Group>
			)}
		</Stack>
	);
}
