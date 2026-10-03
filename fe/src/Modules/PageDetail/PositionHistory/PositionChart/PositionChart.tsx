import { Paper } from "@mantine/core";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import {
	seriesKey,
	toChartRows,
} from "@ViewModels/PageDetailViewModel/Services/ToChartRows/toChartRows";
import { keywordColor } from "../../keywordColors";

interface IPositionChartProps {
	history: TPositionHistory;
	hidden: number[];
}

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
export function PositionChart({ history, hidden }: IPositionChartProps) {
	const rows = toChartRows(history);
	const visible = history.series
		.map((series, index) => ({ series, index }))
		.filter(({ series }) => !hidden.includes(series.keywordId) && series.points.length > 0);

	return (
		<Paper withBorder radius="md" p="md" h={360}>
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" />
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
						labelFormatter={(day) => (typeof day === "string" ? shortDay(day) : day)}
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
	);
}
