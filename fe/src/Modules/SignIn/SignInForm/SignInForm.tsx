import { Alert, Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import { signInSchema, type TSignInFieldErrors, type TSignInValues } from "./SignInSchema";

interface ISignInFormProps {
	onSignedIn: () => void;
}

export function SignInForm({ onSignedIn }: ISignInFormProps) {
	const submitting = useSessionViewModel((state) => state.submitting);
	const actionError = useSessionViewModel((state) => state.actionError);
	const signIn = useSessionViewModel((state) => state.signIn);
	const clearActionError = useSessionViewModel((state) => state.clearActionError);

	const [values, setValues] = useState<TSignInValues>({ email: "", password: "" });
	const [fieldErrors, setFieldErrors] = useState<TSignInFieldErrors>({});

	const change = (field: keyof TSignInValues) => (value: string) => {
		setValues((current) => ({ ...current, [field]: value }));
		setFieldErrors((current) => ({ ...current, [field]: undefined }));
		if (actionError) clearActionError();
	};

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		const parsed = signInSchema.safeParse(values);
		if (!parsed.success) {
			const errors: TSignInFieldErrors = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0] as keyof TSignInValues;
				errors[field] ??= issue.message;
			}
			setFieldErrors(errors);
			return;
		}
		if (await signIn(parsed.data.email, parsed.data.password)) onSignedIn();
	};

	return (
		<form onSubmit={(event) => void submit(event)} noValidate>
			<Stack gap="md">
				{actionError && (
					<Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
						{actionError}
					</Alert>
				)}
				<TextInput
					label="Email"
					type="email"
					autoComplete="username"
					value={values.email}
					onChange={(event) => change("email")(event.currentTarget.value)}
					error={fieldErrors.email}
					disabled={submitting}
					data-autofocus
				/>
				<PasswordInput
					label="Password"
					autoComplete="current-password"
					value={values.password}
					onChange={(event) => change("password")(event.currentTarget.value)}
					error={fieldErrors.password}
					disabled={submitting}
				/>
				<Button type="submit" loading={submitting} fullWidth>
					Sign in
				</Button>
			</Stack>
		</form>
	);
}
