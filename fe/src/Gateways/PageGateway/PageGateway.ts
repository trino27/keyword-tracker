import type { TIsoDay } from "@app/contracts";
import { ABaseGateway } from "../_Shared/ABaseGateway/ABaseGateway";
import {
	pageDetailSchema,
	pageListResponseSchema,
	positionHistorySchema,
	type TPageDetail,
	type TPageListResponse,
	type TPositionHistory,
} from "./Validation/PageSchemas";

export interface IPageListQuery {
	clientId?: number;
	q?: string;
	page: number;
	pageSize: number;
}

const toQueryString = (params: Record<string, string | number | undefined>): string => {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) query.set(key, String(value));
	}
	const text = query.toString();
	return text ? `?${text}` : "";
};

export class PageGateway extends ABaseGateway {
	constructor() {
		super("/pages");
	}

	public list(query: IPageListQuery): Promise<TPageListResponse> {
		return this.request(toQueryString({ ...query }), pageListResponseSchema);
	}

	public get(pageId: number): Promise<TPageDetail> {
		return this.request(`/${pageId}`, pageDetailSchema);
	}

	/** Calendar days in the user's zone; the server converts them, never the browser. */
	public positions(pageId: number, from: TIsoDay, to: TIsoDay): Promise<TPositionHistory> {
		return this.request(
			`/${pageId}/positions${toQueryString({ from, to })}`,
			positionHistorySchema,
		);
	}
}
