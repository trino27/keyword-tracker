import type { MantineColor } from "@mantine/core";
import type { TPageSpeedAvailabilityState } from "@app/contracts";

/**
 * What every screen says about PageSpeed itself, from one Record so the list, the page
 * and the report never word one state two ways. `null`: nothing to say — it works.
 */
export const pageSpeedAvailabilityCopy: Record<
	TPageSpeedAvailabilityState,
	{ short: string; notice: string; color: MantineColor } | null
> = {
	notConfigured: {
		short: "PageSpeed not configured",
		notice: "Speed is not measured: no PageSpeed key is configured. The README says how to add one.",
		color: "gray",
	},
	active: null,
	keyRejected: {
		short: "PageSpeed key rejected",
		notice: "Google rejected the PageSpeed key, so speed measurements are paused. Fix the key and restart the app — the README says how.",
		// Red: something broke and someone has to act, unlike a key never configured.
		color: "red",
	},
};
