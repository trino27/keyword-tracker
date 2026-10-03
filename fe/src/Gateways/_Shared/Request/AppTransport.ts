import { API_BASE_URL } from "@Core/Configs/apiConfig";

/**
 * The only `fetch` in the app: prefixes the API base URL, sends JSON, and always
 * includes credentials so the session cookie travels.
 */
export function appFetch(path: string, init?: RequestInit): Promise<Response> {
	const headers = new Headers(init?.headers);
	if (init?.body !== undefined && !(init.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	return fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: "include" });
}
