import type { z } from "zod";
import { toApiError } from "../Errors/ApiError/ApiError";
import { appFetch } from "../Request/AppTransport";
import { notifyUnauthorized } from "../Request/UnauthorizedSignal/unauthorizedSignal";

export interface IRequestOptions {
	/**
	 * Announce a 401 as an expired session (default). Off for requests where a 401 is an
	 * expected answer — signing in with a wrong password, asking "who am I" signed out.
	 */
	notifyUnauthorized?: boolean;
}

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
		options: IRequestOptions = {},
	): Promise<z.infer<TSchema>> {
		const response = await appFetch(`${this.basePath}${path}`, init);

		if (!response.ok) {
			if (response.status === 401 && options.notifyUnauthorized !== false)
				notifyUnauthorized();
			throw await toApiError(response);
		}
		if (response.status === 204) return schema.parse(undefined);
		return schema.parse(await response.json());
	}
}
