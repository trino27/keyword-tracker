import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safeRedirectPath";

describe("safeRedirectPath", () => {
	it.each(["/pages?q=x", "/pages/12?range=7d", "/clients"])("keeps %s", (path) => {
		expect(safeRedirectPath(path)).toBe(path);
	});

	it.each([
		"//evil.example",
		"/\\evil.example",
		"https://evil.example",
		"javascript:alert(1)",
		"pages",
		"/sign-in?redirect=%2Fpages",
		"",
		undefined,
		42,
	])("drops %j", (value) => {
		expect(safeRedirectPath(value)).toBeNull();
	});
});
