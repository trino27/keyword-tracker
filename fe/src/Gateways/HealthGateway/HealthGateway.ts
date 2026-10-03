import { ABaseGateway } from "../_Shared/ABaseGateway/ABaseGateway";
import { HealthSchema, type THealth } from "./Validation/HealthSchemas";

export class HealthGateway extends ABaseGateway {
	constructor() {
		super("/health");
	}

	public get(): Promise<THealth> {
		return this.request("", HealthSchema);
	}
}
