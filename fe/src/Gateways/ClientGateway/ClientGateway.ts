import { z } from "zod";
import { API_ERROR_CODES, type ICreateClientRequest } from "@app/contracts";
import { ABaseGateway } from "../_Shared/ABaseGateway/ABaseGateway";
import { ApiError } from "../_Shared/Errors/ApiError/ApiError";
import {
	clientListResponseSchema,
	clientResponseSchema,
	runDetailResponseSchema,
	runResponseSchema,
	type TAddClientResult,
	type TClient,
	type TCrawlRunDetail,
	type TRecrawlResult,
} from "./Validation/ClientSchemas";

/** `/clients` and `/crawl-runs` — a crawl run is always read as part of a client's story. */
export class ClientGateway extends ABaseGateway {
	constructor() {
		super("");
	}

	public async list(): Promise<TClient[]> {
		return (await this.request("/clients", clientListResponseSchema)).items;
	}

	public async get(clientId: number): Promise<TClient> {
		return (await this.request(`/clients/${clientId}`, clientResponseSchema)).client;
	}

	public async create(request: ICreateClientRequest): Promise<TAddClientResult> {
		try {
			const { client } = await this.request("/clients", clientResponseSchema, {
				method: "POST",
				body: JSON.stringify(request),
			});
			return { kind: "created", client };
		} catch (error: unknown) {
			if (error instanceof ApiError) {
				if (error.errorCode === API_ERROR_CODES.CLIENT_ALREADY_EXISTS)
					return { kind: "exists", message: error.message };
				if (error.errorCode === API_ERROR_CODES.INVALID_WEBSITE_URL)
					return { kind: "invalidUrl", message: error.message };
			}
			throw error;
		}
	}

	public async recrawl(clientId: number): Promise<TRecrawlResult> {
		try {
			const { run } = await this.request(
				`/clients/${clientId}/crawl-runs`,
				runResponseSchema,
				{
					method: "POST",
				},
			);
			return { kind: "queued", run };
		} catch (error: unknown) {
			if (
				error instanceof ApiError &&
				error.errorCode === API_ERROR_CODES.CRAWL_ALREADY_ACTIVE
			)
				return { kind: "active" };
			throw error;
		}
	}

	/** Deletes the client and everything its crawls produced. */
	public async remove(clientId: number): Promise<void> {
		await this.request(`/clients/${clientId}`, z.undefined(), { method: "DELETE" });
	}

	public async getRun(runId: number): Promise<TCrawlRunDetail> {
		return (await this.request(`/crawl-runs/${runId}`, runDetailResponseSchema)).run;
	}
}
