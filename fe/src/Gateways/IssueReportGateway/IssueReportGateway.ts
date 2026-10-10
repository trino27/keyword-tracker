import { API_ERROR_CODES } from "@app/contracts";
import { ABaseGateway } from "../_Shared/ABaseGateway/ABaseGateway";
import { ApiError } from "../_Shared/Errors/ApiError/ApiError";
import { clientIssueReportSchema, type TIssueReportResult } from "./Validation/IssueReportSchemas";

/** `/clients/:id/issues` — every finding on one client's current crawl, in one read. */
export class IssueReportGateway extends ABaseGateway {
	constructor() {
		super("");
	}

	public async get(clientId: number): Promise<TIssueReportResult> {
		try {
			const report = await this.request(
				`/clients/${clientId}/issues`,
				clientIssueReportSchema,
			);
			return { kind: "report", report };
		} catch (error: unknown) {
			// Another user's client and a deleted one answer alike; the screen says so.
			if (error instanceof ApiError && error.errorCode === API_ERROR_CODES.CLIENT_NOT_FOUND)
				return { kind: "notFound" };
			throw error;
		}
	}
}
