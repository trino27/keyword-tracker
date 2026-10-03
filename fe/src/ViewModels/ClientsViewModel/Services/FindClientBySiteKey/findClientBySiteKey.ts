import { parseWebsiteUrl } from "@app/contracts";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";

/**
 * The client a 409 "already tracked" refers to, found by the same rule the server used
 * (`parseWebsiteUrl`), so `https://www.yoast.com/blog` finds the `yoast.com` client.
 */
export function findClientBySiteKey(clients: TClient[], websiteUrl: string): TClient | null {
	const parsed = parseWebsiteUrl(websiteUrl);
	if (!parsed.ok) return null;
	return clients.find((client) => client.siteKey === parsed.siteKey) ?? null;
}
