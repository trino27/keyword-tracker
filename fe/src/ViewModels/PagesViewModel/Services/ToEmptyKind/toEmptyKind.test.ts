import { describe, expect, it } from "vitest";
import { toEmptyKind } from "./toEmptyKind";

describe("toEmptyKind", () => {
	it("is null when there are rows", () => {
		expect(toEmptyKind(3, { q: "seo" }, 2)).toBeNull();
	});

	it("tells the four empty lists apart", () => {
		expect(toEmptyKind(0, {}, 0)).toBe("noClients");
		expect(toEmptyKind(0, { q: "zzz" }, 2)).toBe("noMatches");
		expect(toEmptyKind(0, { clientId: 7 }, 2)).toBe("noPagesYet");
		expect(toEmptyKind(0, {}, 2)).toBe("noPages");
	});
});
