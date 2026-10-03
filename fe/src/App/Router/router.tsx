import {
	createRootRoute,
	createRoute,
	createRouter,
	lazyRouteComponent,
	Outlet,
	redirect,
	type RouterHistory,
} from "@tanstack/react-router";
import { AppLayout } from "@Modules/_Shared/AppLayout/AppLayout";
import { NotFound } from "@Modules/_Shared/NotFound/NotFound";
import { RouteError } from "@Modules/_Shared/RouteError/RouteError";
import { ClientsScreen } from "@Modules/Clients/ClientsScreen";
import { PagesScreen } from "@Modules/Pages/PagesScreen";
import { SignInScreen } from "@Modules/SignIn/SignInScreen";
import { listenForExpiredSession } from "@ViewModels/SessionViewModel/SessionViewModel";
import { redirectIfSignedIn } from "../Guards/redirectIfSignedIn";
import { requireSession } from "../Guards/requireSession";
import { clientsSearchSchema } from "./SearchSchemas/ClientsSearchSchema/clientsSearchSchema";
import { pageDetailSearchSchema } from "./SearchSchemas/PageDetailSearchSchema/pageDetailSearchSchema";
import { pagesSearchSchema } from "./SearchSchemas/PagesSearchSchema/pagesSearchSchema";
import { signInSearchSchema } from "./SearchSchemas/SignInSearchSchema/signInSearchSchema";

/**
 * The route tree, written by hand rather than generated: where the guards sit is the
 * security-relevant part of this file, and a generated tree hides it in a convention.
 *
 * Screens hang under the pathless `app` layout route, so its guard is inherited by
 * every screen and a new screen cannot be added unguarded by forgetting a line.
 */
const rootRoute = createRootRoute({
	component: Outlet,
	errorComponent: RouteError,
	notFoundComponent: () => <NotFound />,
});

const signInRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/sign-in",
	validateSearch: signInSearchSchema,
	beforeLoad: ({ search }) => redirectIfSignedIn({ search }),
	component: SignInScreen,
	errorComponent: RouteError,
});

/** Pathless: contributes the layout and the session guard, no URL segment. */
const appRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: "app",
	beforeLoad: ({ location }) => requireSession({ location }),
	component: AppLayout,
	// One boundary per screen, so a throw inside a table or a chart leaves the shell,
	// and the navigation out of the broken screen, standing.
	errorComponent: RouteError,
});

const indexRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/",
	beforeLoad: () => {
		throw redirect({ to: "/pages" });
	},
});

const pagesRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/pages",
	validateSearch: pagesSearchSchema,
	component: PagesScreen,
	errorComponent: RouteError,
});

const pageDetailRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/pages/$pageId",
	validateSearch: pageDetailSearchSchema,
	// Its own chunk: the chart library is most of the bundle and only this screen draws.
	component: lazyRouteComponent(
		() => import("@Modules/PageDetail/PageDetailScreen"),
		"PageDetailScreen",
	),
	errorComponent: RouteError,
});

const clientsRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/clients",
	validateSearch: clientsSearchSchema,
	component: ClientsScreen,
	errorComponent: RouteError,
});

const routeTree = rootRoute.addChildren([
	signInRoute,
	appRoute.addChildren([indexRoute, pagesRoute, pageDetailRoute, clientsRoute]),
]);

export function createAppRouter(history?: RouterHistory) {
	const appRouter = createRouter({ routeTree, history, defaultPreload: "intent" });
	// A 401 on any request while signed in: back to sign-in, then to where the user was.
	listenForExpiredSession(() => {
		void appRouter.navigate({
			to: "/sign-in",
			search: { redirect: appRouter.state.location.href },
		});
	});
	return appRouter;
}

export const router = createAppRouter();

/** Registers the tree's types globally, so a typo in `<Link to>` fails at compile time. */
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
