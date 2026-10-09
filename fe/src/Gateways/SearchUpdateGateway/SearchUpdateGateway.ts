import { ABaseGateway } from "../_Shared/ABaseGateway/ABaseGateway";
import {
	searchUpdatesResponseSchema,
	type TSearchUpdatesResponse,
} from "./Validation/SearchUpdateSchemas";

/** `/search-updates` — Google's announced ranking updates, the same for every user. */
export class SearchUpdateGateway extends ABaseGateway {
	constructor() {
		super("/search-updates");
	}

	public list(): Promise<TSearchUpdatesResponse> {
		return this.request("", searchUpdatesResponseSchema);
	}
}
