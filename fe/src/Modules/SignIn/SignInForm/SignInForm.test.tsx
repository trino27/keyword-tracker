import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionGateway } from "@Gateways/SessionGateway/SessionGateway";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import { SignInForm } from "./SignInForm";

const renderForm = (onSignedIn = vi.fn()) => {
	render(
		<MantineProvider>
			<SignInForm onSignedIn={onSignedIn} />
		</MantineProvider>,
	);
	return { onSignedIn };
};

const fill = async (email: string, password: string) => {
	const user = userEvent.setup();
	await user.type(screen.getByLabelText("Email"), email);
	await user.type(screen.getByLabelText("Password"), password);
	await user.click(screen.getByRole("button", { name: "Sign in" }));
};

beforeEach(() => {
	vi.restoreAllMocks();
	useSessionViewModel.getState().reset();
});

describe("SignInForm", () => {
	it("shows the refusal and keeps what was typed", async () => {
		vi.spyOn(SessionGateway.prototype, "login").mockResolvedValue({ kind: "invalid" });
		const { onSignedIn } = renderForm();

		await fill("yoast.manager@example.com", "wrong-password");

		expect(await screen.findByText("Email or password is incorrect")).toBeInTheDocument();
		expect(screen.getByLabelText("Email")).toHaveValue("yoast.manager@example.com");
		expect(onSignedIn).not.toHaveBeenCalled();
	});

	it("checks the fields before asking the server", async () => {
		const login = vi.spyOn(SessionGateway.prototype, "login");
		renderForm();

		await userEvent.setup().click(screen.getByRole("button", { name: "Sign in" }));

		expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
		expect(screen.getByText("Enter your password")).toBeInTheDocument();
		expect(login).not.toHaveBeenCalled();
	});

	it("signs in and hands control back", async () => {
		vi.spyOn(SessionGateway.prototype, "login").mockResolvedValue({
			kind: "signedIn",
			user: { id: 1, email: "yoast.manager@example.com", timeZone: "America/Toronto" },
		});
		const { onSignedIn } = renderForm();

		await fill("yoast.manager@example.com", "right-password");

		expect(onSignedIn).toHaveBeenCalledTimes(1);
	});
});
