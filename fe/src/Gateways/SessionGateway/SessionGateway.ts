import { z } from "zod";
import type { ILoginRequest } from "@app/contracts";
import { ABaseGateway } from "../_Shared/ABaseGateway/ABaseGateway";
import { ApiError } from "../_Shared/Errors/ApiError/ApiError";
import {
	sessionResponseSchema,
	type TSessionUser,
	type TSignInResult,
} from "./Validation/SessionSchemas";

export class SessionGateway extends ABaseGateway {
	constructor() {
		super("/auth");
	}

	/** Wrong credentials (401) and too many attempts (429) are answers, never a redirect. */
	public async login(request: ILoginRequest): Promise<TSignInResult> {
		try {
			const { user } = await this.request(
				"/login",
				sessionResponseSchema,
				{ method: "POST", body: JSON.stringify(request) },
				{ notifyUnauthorized: false },
			);
			return { kind: "signedIn", user };
		} catch (error: unknown) {
			if (error instanceof ApiError && error.status === 401) return { kind: "invalid" };
			if (error instanceof ApiError && error.status === 429) return { kind: "throttled" };
			throw error;
		}
	}

	public async logout(): Promise<void> {
		await this.request(
			"/logout",
			z.undefined(),
			{ method: "POST" },
			{ notifyUnauthorized: false },
		);
	}

	/** The signed-in user, or null when there is no session — that is not an error. */
	public async me(): Promise<TSessionUser | null> {
		try {
			const { user } = await this.request("/me", sessionResponseSchema, undefined, {
				notifyUnauthorized: false,
			});
			return user;
		} catch (error: unknown) {
			if (error instanceof ApiError && error.status === 401) return null;
			throw error;
		}
	}
}
