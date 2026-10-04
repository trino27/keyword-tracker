import { API_BASE_URL } from "@Core/Configs/apiConfig";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * The only `fetch` in the app: prefixes the API base URL, sends JSON, and always
 * includes credentials so the session cookie travels.
 *
 * Every mutating request declares JSON, including the ones with nothing to send
 * (sign-out, start a crawl, delete a client, generate positions). The API refuses a
 * mutating request that does not — that refusal is half of its CSRF defence, and a
 * cross-site form cannot set this header.
 */
export function appFetch(path: string, init?: RequestInit): Promise<Response> {
	const headers = new Headers(init?.headers);
	const method = (init?.method ?? "GET").toUpperCase();
	const sendsForm = init?.body instanceof FormData;
	if (!sendsForm && (init?.body !== undefined || MUTATING_METHODS.has(method))) {
		headers.set("Content-Type", "application/json");
	}

	return fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: "include" });
}
