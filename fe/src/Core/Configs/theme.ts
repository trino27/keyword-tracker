import { createTheme } from "@mantine/core";

/**
 * The one Mantine theme. Colours carry meaning across screens — position buckets, crawl
 * statuses, issue severities — so they are chosen once here and in `Core/Constants/`.
 */
export const theme = createTheme({
	primaryColor: "indigo",
	defaultRadius: "md",
	fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	headings: { fontWeight: "650" },
	components: {
		Table: { defaultProps: { verticalSpacing: "sm" } },
	},
});
