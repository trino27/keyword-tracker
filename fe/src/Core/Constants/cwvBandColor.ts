import type { MantineColor } from "@mantine/core";
import type { TCwvBand } from "@app/contracts";

/**
 * One colour per Core Web Vitals band, everywhere a badge is drawn. A Record, so a band
 * added to the contract without a colour does not compile. `noData` is grey: Google has
 * no real-visitor measurement, which is neither good nor bad.
 */
export const cwvBandColor: Record<TCwvBand | "noData", MantineColor> = {
	good: "teal",
	needsImprovement: "yellow",
	poor: "red",
	noData: "gray",
};

export const cwvBandLabel: Record<TCwvBand, string> = {
	good: "good",
	needsImprovement: "needs improvement",
	poor: "poor",
};
