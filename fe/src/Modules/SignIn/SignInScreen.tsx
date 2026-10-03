import { Center, Paper, Stack, Text, Title } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { safeRedirectPath } from "@Core/Helpers/SafeRedirectPath/safeRedirectPath";
import { SignInForm } from "./SignInForm/SignInForm";
import styles from "./SignInScreen.module.scss";

export function SignInScreen() {
	const { redirect } = useSearch({ from: "/sign-in" });
	const navigate = useNavigate();

	return (
		<Center className={styles.screen}>
			<Paper withBorder shadow="sm" radius="lg" p="xl" className={styles.card}>
				<Stack gap="lg">
					<Stack gap={4}>
						<Title order={2}>Sign in</Title>
						<Text c="dimmed" size="sm">
							Track where your clients' blog posts rank, and what holds them back.
						</Text>
					</Stack>
					<SignInForm
						onSignedIn={() =>
							void navigate({ href: safeRedirectPath(redirect) ?? "/pages" })
						}
					/>
				</Stack>
			</Paper>
		</Center>
	);
}
