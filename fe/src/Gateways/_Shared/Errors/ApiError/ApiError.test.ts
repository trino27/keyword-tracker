import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "./ApiError";

const respond = (status: number, body: string) => new Response(body, { status });

describe("toApiError", () => {
	it("keeps the backend's code and message", async () => {
		const error = await toApiError(
			respond(409, JSON.stringify({ errorCode: "CLIENT_EXISTS", message: "Already added" })),
		);

		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(409);
		expect(error.errorCode).toBe("CLIENT_EXISTS");
		expect(error.message).toBe("Already added");
	});

	it("joins validation messages into one sentence", async () => {
		const error = await toApiError(
			respond(400, JSON.stringify({ errorCode: "BAD_REQUEST", message: ["a", "b"] })),
		);

		expect(error.message).toBe("a, b");
	});

	it("survives an HTML error page and still reports the status", async () => {
		const error = await toApiError(respond(502, "<html>Bad Gateway</html>"));

		expect(error.errorCode).toBeUndefined();
		expect(error.message).toBe("Request failed with status 502");
	});
});
