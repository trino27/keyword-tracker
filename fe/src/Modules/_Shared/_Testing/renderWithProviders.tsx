import { MantineProvider } from "@mantine/core";
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * For component tests: Mantine's provider, and a one-route router so `<Link>`s render
 * real hrefs. The component under test is the root route's component.
 */
export function renderWithProviders(ui: () => ReactNode, path = "/") {
	const router = createRouter({
		routeTree: createRootRoute({ component: ui }),
		history: createMemoryHistory({ initialEntries: [path] }),
	});
	return render(
		<MantineProvider>
			<RouterProvider router={router as never} />
		</MantineProvider>,
	);
}
