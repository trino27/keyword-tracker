export type TDateStyle = "date" | "dateTime" | "shortDate";

const OPTIONS: Record<TDateStyle, Intl.DateTimeFormatOptions> = {
	date: { year: "numeric", month: "short", day: "numeric" },
	dateTime: {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	},
	shortDate: { month: "short", day: "numeric" },
};

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * The only way the app turns an instant into text: always in the USER's zone (from the
 * session), never the browser's — a reviewer in Tokyo sees the dates a manager in
 * Toronto sees.
 */
export function formatInZone(
	instant: string | Date,
	timeZone: string,
	style: TDateStyle = "date",
): string {
	const key = `${timeZone}|${style}`;
	let formatter = formatters.get(key);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", { ...OPTIONS[style], timeZone });
		formatters.set(key, formatter);
	}
	return formatter.format(typeof instant === "string" ? new Date(instant) : instant);
}

/** The calendar day (YYYY-MM-DD) an instant falls on in the zone. */
export function dayInZone(instant: string | Date, timeZone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(typeof instant === "string" ? new Date(instant) : instant);
}
