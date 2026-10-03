/**
 * A non-2xx answer from the backend.
 *
 * The backend always answers `{ errorCode, message }` (its exception filter sees to
 * it), so `errorCode` is the stable thing to branch on and `message` is the sentence
 * to show.
 */
export class ApiError extends Error {
	public readonly status: number;
	public readonly errorCode: string | undefined;

	constructor(status: number, errorCode: string | undefined, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.errorCode = errorCode;
	}
}

export const isUnauthorized = (error: unknown): boolean =>
	error instanceof ApiError && error.status === 401;

const nonEmptyString = (value: unknown): string | undefined =>
	typeof value === "string" && value.trim().length > 0 ? value : undefined;

/**
 * Builds an `ApiError` from a failed response.
 *
 * Reads the body as text first: a proxy error page is HTML, and `response.json()` on
 * it would throw a SyntaxError that hides the status entirely.
 */
export async function toApiError(response: Response): Promise<ApiError> {
	const raw = await response.text().catch(() => "");

	let body: Record<string, unknown> = {};
	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed === "object" && parsed !== null) body = parsed as Record<string, unknown>;
	} catch {
		// Not JSON — the status below still says what happened.
	}

	const message = Array.isArray(body.message)
		? body.message.join(", ")
		: (nonEmptyString(body.message) ?? `Request failed with status ${response.status}`);

	return new ApiError(response.status, nonEmptyString(body.errorCode), message);
}
