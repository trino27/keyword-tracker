import { addDays, todayInZone, type TIsoDay } from "@app/contracts";

export const RANGE_PRESETS = ["7d", "30d", "90d", "12m", "custom"] as const;
export type TRangePreset = (typeof RANGE_PRESETS)[number];

const PRESET_DAYS: Record<Exclude<TRangePreset, "custom">, number> = {
	"7d": 7,
	"30d": 30,
	"90d": 90,
	"12m": 365,
};

export interface IDayRange {
	from: TIsoDay;
	to: TIsoDay;
}

/**
 * A preset or a custom pick → calendar days in the USER's zone. "Today" is the user's
 * today, so a Toronto manager at 9 pm sees the same range on any laptop.
 */
export function resolveRange(
	preset: TRangePreset,
	custom: { from?: TIsoDay; to?: TIsoDay },
	timeZone: string,
	now: Date = new Date(),
): IDayRange {
	const today = todayInZone(now, timeZone);
	if (preset === "custom" && custom.from && custom.to) {
		return custom.from <= custom.to
			? { from: custom.from, to: custom.to }
			: { from: custom.to, to: custom.from };
	}
	const days = preset === "custom" ? PRESET_DAYS["30d"] : PRESET_DAYS[preset];
	return { from: addDays(today, -(days - 1)), to: today };
}
