import { MantineProvider } from "@mantine/core";
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientGateway } from "@Gateways/ClientGateway/ClientGateway";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { AddClientForm } from "./AddClientForm";

const YOAST: TClient = {
	id: 7,
	name: "Yoast",
	websiteUrl: "https://yoast.com",
	siteKey: "yoast.com",
	currentPageCount: 15,
	latestRun: null,
	createdAt: "2026-10-03T12:00:00.000Z",
};

/** The form links with <Link>, which needs a router around it. */
const renderForm = (onAdded = vi.fn()) => {
	const router = createRouter({
		routeTree: createRootRoute({ component: () => <AddClientForm onAdded={onAdded} /> }),
		history: createMemoryHistory({ initialEntries: ["/clients"] }),
	});
	render(
		<MantineProvider>
			<RouterProvider router={router as never} />
		</MantineProvider>,
	);
	return { onAdded };
};

const submit = async (name: string, website: string) => {
	const user = userEvent.setup();
	await user.type(await screen.findByLabelText("Client name"), name);
	await user.type(screen.getByLabelText("Website"), website);
	await user.click(screen.getByRole("button", { name: "Add" }));
};

beforeEach(() => {
	vi.restoreAllMocks();
	useClientsViewModel.getState().reset();
});

describe("AddClientForm", () => {
	it("an already-tracked site links to that client's pages", async () => {
		useClientsViewModel.setState({ clients: [YOAST] });
		vi.spyOn(ClientGateway.prototype, "create").mockResolvedValue({
			kind: "exists",
			message: "You already track this website",
		});
		const { onAdded } = renderForm();

		await submit("Again", "https://www.yoast.com/blog");

		expect(await screen.findByText(/You already track this website/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "view its pages" })).toHaveAttribute(
			"href",
			"/pages?clientId=7",
		);
		expect(onAdded).not.toHaveBeenCalled();
	});

	it("refuses a local address before sending", async () => {
		const create = vi.spyOn(ClientGateway.prototype, "create");
		renderForm();

		await submit("Local", "localhost:3000");

		expect(await screen.findByText("Use a public website address")).toBeInTheDocument();
		expect(create).not.toHaveBeenCalled();
	});

	it("hands over the new client's id", async () => {
		vi.spyOn(ClientGateway.prototype, "create").mockResolvedValue({
			kind: "created",
			client: YOAST,
		});
		vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([YOAST]);
		const { onAdded } = renderForm();

		await submit("Yoast", "yoast.com");

		expect(onAdded).toHaveBeenCalledWith(7);
	});
});
