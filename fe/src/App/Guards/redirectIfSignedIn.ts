import { redirect } from "@tanstack/react-router";
import { safeRedirectPath } from "@Core/Helpers/SafeRedirectPath/safeRedirectPath";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";

/** A signed-in user opening /sign-in goes where they meant to, or to the pages list. */
export async function redirectIfSignedIn({
	search,
}: {
	search: { redirect?: string };
}): Promise<void> {
	const user = await useSessionViewModel.getState().fetchSession();
	if (user) {
		throw redirect({ href: safeRedirectPath(search.redirect) ?? "/pages" });
	}
}
