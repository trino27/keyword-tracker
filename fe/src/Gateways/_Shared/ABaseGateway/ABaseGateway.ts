import type { z } from "zod";
import { toApiError } from "../Errors/ApiError/ApiError";
import { appFetch } from "../Request/AppTransport";

/**
 * The base of every gateway: one class per backend resource, one method per endpoint.
 *
 * Every response is parsed by a zod schema. A shape the two sides disagree about
 * fails here, loudly, instead of rendering `undefined` three components later.
 */
export abstract class ABaseGateway {
	private readonly basePath: string;

	protected constructor(basePath: string) {
		this.basePath = basePath;
	}

	protected async request<TSchema extends z.ZodType>(
		path: string,
		schema: TSchema,
		init?: RequestInit,
	): Promise<z.infer<TSchema>> {
		const response = await appFetch(`${this.basePath}${path}`, init);

		if (!response.ok) throw await toApiError(response);
		if (response.status === 204) return schema.parse(undefined);
		return schema.parse(await response.json());
	}
}
