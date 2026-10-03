import { Group, SegmentedControl } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { isIsoDay, MAX_HISTORY_DAYS, type TIsoDay } from "@app/contracts";
import type {
	IDayRange,
	TRangePreset,
} from "@ViewModels/PageDetailViewModel/Services/ResolveRange/resolveRange";

const PRESETS: { value: TRangePreset; label: string }[] = [
	{ value: "7d", label: "7 days" },
	{ value: "30d", label: "30 days" },
	{ value: "90d", label: "90 days" },
	{ value: "12m", label: "12 months" },
	{ value: "custom", label: "Custom" },
];

interface IRangeControlsProps {
	preset: TRangePreset;
	range: IDayRange;
	/** The user's today — the latest day a range may end on. */
	today: TIsoDay;
	view: "chart" | "table";
	onPreset: (preset: TRangePreset) => void;
	onCustom: (range: IDayRange) => void;
	onView: (view: "chart" | "table") => void;
}

export function RangeControls({
	preset,
	range,
	today,
	view,
	onPreset,
	onCustom,
	onView,
}: IRangeControlsProps) {
	return (
		<Group justify="space-between" gap="sm" wrap="wrap">
			<Group gap="sm" wrap="wrap">
				<SegmentedControl
					aria-label="Range"
					size="xs"
					data={PRESETS}
					value={preset}
					onChange={(value) => onPreset(value)}
				/>
				{preset === "custom" && (
					<DatePickerInput
						type="range"
						aria-label="Custom range"
						size="xs"
						w={240}
						value={[range.from, range.to]}
						maxDate={today}
						maxLevel="year"
						onChange={([from, to]) => {
							if (from && to && isIsoDay(from) && isIsoDay(to))
								onCustom({ from, to });
						}}
						description={`Up to ${MAX_HISTORY_DAYS} days`}
					/>
				)}
			</Group>
			<SegmentedControl
				aria-label="View"
				size="xs"
				data={[
					{ value: "chart", label: "Chart" },
					{ value: "table", label: "Table" },
				]}
				value={view}
				onChange={(value) => onView(value)}
			/>
		</Group>
	);
}
