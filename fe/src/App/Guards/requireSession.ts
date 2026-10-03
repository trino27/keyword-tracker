import { redirect, type ParsedLocation } from "@tanstack/react-router";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";

/**
 * On the pathless `app` route, so every screen under it is guarded. Signed out, the
 * visitor goes to sign-in carrying where they were going; the sign-in screen sends
 * them back there (after `safeRedirectPath` has checked it is a path of ours).
 */
export async function requireSession({ location }: { location: ParsedLocation }): Promise<void> {
	const user = await useSessionViewModel.getState().fetchSession();
	if (!user) {
		throw redirect({ to: "/sign-in", search: { redirect: location.href } });
	}
}
