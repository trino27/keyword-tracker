import { Stack } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageHeader } from "@Modules/_Shared/PageHeader/PageHeader";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { summarizeClients } from "@ViewModels/ClientsViewModel/Services/SummarizeClients/summarizeClients";
import { AddClientForm } from "./AddClientForm/AddClientForm";
import { ClientsTable } from "./ClientsTable/ClientsTable";

/** The brief's "Add a client" screen: the form, and below it the clients it adds. */
export function ClientsScreen() {
	const { expanded } = useSearch({ from: "/app/clients" });
	const navigate = useNavigate({ from: "/clients" });
	const clients = useClientsViewModel((state) => state.clients);
	const fetchClients = useClientsViewModel((state) => state.fetchClients);
	const startPolling = useClientsViewModel((state) => state.startPolling);
	const stopPolling = useClientsViewModel((state) => state.stopPolling);

	useEffect(() => {
		void fetchClients().then(() => startPolling());
		return stopPolling;
	}, [fetchClients, startPolling, stopPolling]);

	return (
		<Stack gap="lg">
			<PageHeader title="Clients" description={summarizeClients(clients)} />
			<AddClientForm
				onAdded={(clientId) => void navigate({ to: "/pages", search: { clientId } })}
			/>
			<ClientsTable
				expandedClientId={expanded}
				onToggle={(clientId) =>
					void navigate({
						search: { expanded: expanded === clientId ? undefined : clientId },
						replace: true,
					})
				}
			/>
		</Stack>
	);
}
