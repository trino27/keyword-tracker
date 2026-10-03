import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { HomeScreen } from "@Modules/Home/HomeScreen";
import { AppLayout } from "@Modules/_Shared/AppLayout/AppLayout";

/**
 * The route tree, written by hand rather than generated: where the guards sit is the
 * security-relevant part of this file, and a generated tree hides it in a convention.
 *
 * Screens hang under the pathless `app` layout route, so a guard placed on it is
 * inherited by every screen and a new screen cannot be added unguarded by forgetting
 * a line.
 */
const rootRoute = createRootRoute({
	component: Outlet,
});

/** Pathless: contributes the layout (and, later, the sign-in guard), no URL segment. */
const appRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: "app",
	component: AppLayout,
});

const homeRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/",
	component: HomeScreen,
});

const routeTree = rootRoute.addChildren([appRoute.addChildren([homeRoute])]);

export const router = createRouter({ routeTree });

/** Registers the tree's types globally, so a typo in `<Link to>` fails at compile time. */
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
