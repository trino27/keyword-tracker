import { create } from "zustand";
import type { TIssuesSearch } from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import type { TPagesSearch } from "@App/Router/SearchSchemas/PagesSearchSchema/pagesSearchSchema";
import { registerUserStoreReset } from "../SessionViewModel/SessionViewModel";

interface IScreenFiltersState {
	/** The pages list's last filters, page and page size; null until the list is opened. */
	pages: TPagesSearch | null;
	/** The report's last client, grouping and filters; null until the report is opened. */
	issues: TIssuesSearch | null;
}

interface IScreenFiltersActions {
	rememberPages: (search: TPagesSearch) => void;
	rememberIssues: (search: TIssuesSearch) => void;
	reset: () => void;
}

export type IScreenFiltersViewModel = IScreenFiltersState & IScreenFiltersActions;

const initialState: IScreenFiltersState = { pages: null, issues: null };

/**
 * What each list screen was last showing, so leaving it and coming back through the
 * navigation reopens it as it was — the URL is still the state, this only remembers the
 * last one per screen. Forgotten on sign-out, like every user store.
 */
export const useScreenFiltersViewModel = create<IScreenFiltersViewModel>()((set) => ({
	...initialState,
	rememberPages: (search) => set({ pages: search }),
	rememberIssues: (search) => set({ issues: search }),
	reset: () => set(initialState),
}));

registerUserStoreReset(() => useScreenFiltersViewModel.getState().reset());

/**
 * Where "Issues" in the navigation goes: the report as it was last left, or — never
 * opened yet — the client the pages list is filtered to, so a chosen client carries over.
 */
export function issuesSearchToRestore(state: IScreenFiltersState): Partial<TIssuesSearch> {
	if (state.issues) return state.issues;
	return state.pages?.clientId === undefined ? {} : { clientId: state.pages.clientId };
}
