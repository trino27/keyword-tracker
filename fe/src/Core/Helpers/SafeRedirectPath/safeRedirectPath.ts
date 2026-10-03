/**
 * The `redirect` search parameter, only if it is a path inside this app.
 *
 * It arrives in a URL anyone can craft: `?redirect=https://evil.example` or
 * `//evil.example` (protocol-relative) after sign-in would hand the user to another
 * site with the app's trust. Anything but a same-origin path is dropped.
 */
export function safeRedirectPath(value: unknown): string | null {
	if (typeof value !== "string") return null;
	if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
	if (value.startsWith("/sign-in")) return null;
	return value;
}
