import { ABaseGateway } from "../_Shared/ABaseGateway/ABaseGateway";
import { positionFillResultSchema, type TPositionFillResult } from "./Validation/PositionSchemas";

/** `/positions` — the invented rank history the seed generates, asked for from the UI. */
export class PositionGateway extends ABaseGateway {
	constructor() {
		super("/positions");
	}

	/** Fills the signed-in user's missing daily positions; the server scopes it. */
	public fill(): Promise<TPositionFillResult> {
		return this.request("/fill", positionFillResultSchema, { method: "POST" });
	}
}
