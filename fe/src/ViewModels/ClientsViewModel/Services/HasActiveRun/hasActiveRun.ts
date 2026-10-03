import { ACTIVE_CRAWL_RUN_STATUSES } from "@app/contracts";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";

const active: readonly string[] = ACTIVE_CRAWL_RUN_STATUSES;

/** A run is queued or running: worth polling for. */
export const isClientCrawling = (client: TClient): boolean =>
	client.latestRun !== null && active.includes(client.latestRun.status);

export const hasActiveRun = (clients: TClient[]): boolean => clients.some(isClientCrawling);
