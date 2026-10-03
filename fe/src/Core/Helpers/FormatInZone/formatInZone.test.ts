import { describe, expect, it } from "vitest";
import { dayInZone, formatInZone } from "./formatInZone";

/** 03:30 UTC on Nov 2 — still Nov 1 in Toronto, already Nov 2 in Tokyo. */
const INSTANT = "2026-11-02T03:30:00.000Z";

describe("formatInZone", () => {
	it("formats in the given zone, not the machine's", () => {
		expect(formatInZone(INSTANT, "America/Toronto")).toBe("Nov 1, 2026");
		expect(formatInZone(INSTANT, "Asia/Tokyo")).toBe("Nov 2, 2026");
	});

	it("formats a date and time, and a short date", () => {
		expect(formatInZone(INSTANT, "America/Toronto", "dateTime")).toBe("Nov 1, 2026, 10:30 PM");
		expect(formatInZone(INSTANT, "UTC", "shortDate")).toBe("Nov 2");
	});
});

describe("dayInZone", () => {
	it("gives the calendar day of an instant in the zone", () => {
		expect(dayInZone(INSTANT, "America/Toronto")).toBe("2026-11-01");
		expect(dayInZone("2026-11-01T12:00:00.000Z", "America/Toronto")).toBe("2026-11-01");
	});
});
