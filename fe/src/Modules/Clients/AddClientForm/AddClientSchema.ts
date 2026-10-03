import { parseWebsiteUrl } from "@app/contracts";
import { z } from "zod";

const URL_REFUSALS: Record<string, string> = {
	invalid: "Enter a website address, for example yoast.com",
	unsupported_scheme: "Use an http or https address",
	credentials: "Remove the user name and password from the address",
	ip_address: "Use the site's domain name, not an IP address",
	local_host: "Use a public website address",
};

/** The same website rule the server applies (`parseWebsiteUrl`), checked before sending. */
export const addClientSchema = z.object({
	name: z.string().trim().min(1, "Give the client a name").max(120, "At most 120 characters"),
	websiteUrl: z
		.string()
		.trim()
		.min(1, "Enter the client's website")
		.superRefine((value, context) => {
			const parsed = parseWebsiteUrl(value);
			if (!parsed.ok)
				context.addIssue({ code: "custom", message: URL_REFUSALS[parsed.reason] });
		}),
});

export type TAddClientValues = z.input<typeof addClientSchema>;
