import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "30 pages across 2 clients" — the clients screen's subtitle. */
export function summarizeClients(clients: TClient[]): string {
	if (clients.length === 0) return "No clients yet";
	const pages = clients.reduce((sum, client) => sum + client.currentPageCount, 0);
	return `${plural(pages, "page", "pages")} across ${plural(clients.length, "client", "clients")}`;
}
