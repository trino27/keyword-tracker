const UNREACHABLE = "Could not reach the server";

const CONTRACT_DRIFT =
	"The server answered in a shape this app does not understand. " +
	"This is a bug on our side — retrying will not help.";

/** A zod failure, recognised by shape so Core does not depend on zod. */
const isSchemaValidationError = (error: unknown): boolean => {
	if (typeof error !== "object" || error === null) return false;
	const candidate = error as { name?: unknown; issues?: unknown };
	return candidate.name === "ZodError" || Array.isArray(candidate.issues);
};

/**
 * The one sentence a screen shows for a failure.
 *
 * A schema failure is told apart from a server message: the two sides disagree about
 * a contract, which no retry fixes and which a developer needs to see in the console.
 */
export function describeError(error: unknown): string {
	if (isSchemaValidationError(error)) {
		console.error("[describeError] response failed schema validation", error);
		return CONTRACT_DRIFT;
	}
	if (error instanceof Error && error.message.trim().length > 0) return error.message;
	return UNREACHABLE;
}
