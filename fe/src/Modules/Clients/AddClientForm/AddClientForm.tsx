import { Alert, Button, Grid, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconAlertCircle, IconPlus } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { AnchorLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { addClientSchema, type TAddClientValues } from "./AddClientSchema";

interface IAddClientFormProps {
	/** Called with the new client's id; the screen takes the user to its pages. */
	onAdded: (clientId: number) => void;
}

type TFieldErrors = Partial<Record<keyof TAddClientValues, string>>;

export function AddClientForm({ onAdded }: IAddClientFormProps) {
	const submitting = useClientsViewModel((state) => state.submitting);
	const actionError = useClientsViewModel((state) => state.actionError);
	const websiteError = useClientsViewModel((state) => state.websiteError);
	const addClient = useClientsViewModel((state) => state.addClient);
	const clearFormErrors = useClientsViewModel((state) => state.clearFormErrors);

	const [values, setValues] = useState<TAddClientValues>({ name: "", websiteUrl: "" });
	const [fieldErrors, setFieldErrors] = useState<TFieldErrors>({});

	const change = (field: keyof TAddClientValues, value: string) => {
		setValues((current) => ({ ...current, [field]: value }));
		setFieldErrors((current) => ({ ...current, [field]: undefined }));
		if (actionError || websiteError) clearFormErrors();
	};

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		const parsed = addClientSchema.safeParse(values);
		if (!parsed.success) {
			const errors: TFieldErrors = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0] as keyof TAddClientValues;
				errors[field] ??= issue.message;
			}
			setFieldErrors(errors);
			return;
		}
		const client = await addClient(parsed.data);
		if (client) {
			setValues({ name: "", websiteUrl: "" });
			onAdded(client.id);
		}
	};

	const websiteMessage = fieldErrors.websiteUrl ?? websiteError?.message;

	return (
		<Paper withBorder radius="md" p="lg">
			<form onSubmit={(event) => void submit(event)} noValidate>
				<Stack gap="md">
					<Stack gap={2}>
						<Title order={4}>Add a client</Title>
						<Text size="sm" c="dimmed">
							We find the blog sitemap and crawl its first 15 posts. That takes a
							minute; you can watch it on the client's pages. Positions appear after
							the next seed run.
						</Text>
					</Stack>
					{actionError && (
						<Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
							{actionError}
						</Alert>
					)}
					<Grid align="flex-start">
						<Grid.Col span={{ base: 12, sm: 5 }}>
							<TextInput
								label="Client name"
								placeholder="Yoast"
								value={values.name}
								onChange={(event) => change("name", event.currentTarget.value)}
								error={fieldErrors.name}
								disabled={submitting}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 5 }}>
							<TextInput
								label="Website"
								placeholder="yoast.com"
								value={values.websiteUrl}
								onChange={(event) =>
									change("websiteUrl", event.currentTarget.value)
								}
								error={
									websiteMessage && (
										<>
											{websiteMessage}
											{websiteError?.existingClientId !== undefined && (
												<>
													{" — "}
													<AnchorLink
														to="/pages"
														search={{
															clientId: websiteError.existingClientId,
														}}
														size="xs"
													>
														view its pages
													</AnchorLink>
												</>
											)}
										</>
									)
								}
								disabled={submitting}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 2 }}>
							<Button
								type="submit"
								fullWidth
								mt={{ base: 0, sm: 25 }}
								loading={submitting}
								leftSection={<IconPlus size={16} />}
							>
								Add
							</Button>
						</Grid.Col>
					</Grid>
				</Stack>
			</form>
		</Paper>
	);
}
