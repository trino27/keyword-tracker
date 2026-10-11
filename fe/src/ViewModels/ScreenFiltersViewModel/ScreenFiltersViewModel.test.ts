import { beforeEach, describe, expect, it } from "vitest";
import { issuesSearchToRestore, useScreenFiltersViewModel } from "./ScreenFiltersViewModel";

const vm = () => useScreenFiltersViewModel.getState();

const ISSUES = {
	clientId: 4,
	group: "page" as const,
	levels: ["error" as const],
	type: "speed" as const,
};

beforeEach(() => vm().reset());

describe("ScreenFiltersViewModel", () => {
	it("remembers each screen's last search", () => {
		vm().rememberPages({ clientId: 2, q: "seo", page: 3, pageSize: 50 });
		vm().rememberIssues(ISSUES);

		expect(vm().pages).toEqual({ clientId: 2, q: "seo", page: 3, pageSize: 50 });
		expect(vm().issues).toEqual(ISSUES);
	});

	it("reopens the report as it was left", () => {
		vm().rememberIssues(ISSUES);
		vm().rememberPages({ clientId: 2, page: 1, pageSize: 20 });

		expect(issuesSearchToRestore(vm())).toEqual(ISSUES);
	});

	it("carries the pages list's client into a report never opened", () => {
		vm().rememberPages({ clientId: 2, page: 1, pageSize: 20 });

		expect(issuesSearchToRestore(vm())).toEqual({ clientId: 2 });
	});

	it("restores nothing before either screen was opened, and forgets on reset", () => {
		expect(issuesSearchToRestore(vm())).toEqual({});
		vm().rememberIssues(ISSUES);

		vm().reset();

		expect(vm()).toMatchObject({ pages: null, issues: null });
	});
});
