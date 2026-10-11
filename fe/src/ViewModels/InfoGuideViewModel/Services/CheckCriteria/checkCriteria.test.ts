import { describe, expect, it } from "vitest";
import { CWV_ISSUE_CODES } from "@app/contracts";
import { CHECK_CRITERIA } from "./checkCriteria";

const DESKTOP_CODES = Object.values(CWV_ISSUE_CODES.desktop).flatMap((byBand) =>
	Object.values(byBand),
);

describe("CHECK_CRITERIA", () => {
	// The desktop cards are the mobile ones with their measurement swapped: a mobile text
	// reworded without the swap would leave a desktop card telling the mobile story.
	it.each(DESKTOP_CODES)("%s tells the desktop measurement, never the mobile one", (code) => {
		const { howChecked, manualCheck } = CHECK_CRITERIA[code];

		expect(howChecked).toContain("desktop strategy");
		expect(howChecked).not.toContain("mobile strategy");
		expect(manualCheck.join(" ")).toContain("choose Desktop");
		expect(manualCheck.join(" ")).not.toContain("choose Mobile");
	});
});
