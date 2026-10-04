import { AppShell, Avatar, Container, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { IconChartLine, IconChevronDown, IconLogout } from "@tabler/icons-react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import styles from "./AppLayout.module.scss";

/** How wide the content may run before the page keeps it off the window edge. */
const CONTENT_WIDTH = 1600;

/** The screens the navigation offers; a screen joins it when it is finished. */
const NAVIGATION = [
	{ to: "/pages", label: "Pages" },
	{ to: "/clients", label: "Clients" },
] as const;

/** The frame every signed-in screen renders inside: brand, navigation, the user. */
export function AppLayout() {
	const user = useSessionViewModel((state) => state.user);
	const signOut = useSessionViewModel((state) => state.signOut);
	const navigate = useNavigate();

	const handleSignOut = async () => {
		await signOut();
		await navigate({ to: "/sign-in", search: {} });
	};

	return (
		<AppShell header={{ height: 60 }} padding="md">
			<AppShell.Header>
				<Container size={CONTENT_WIDTH} h="100%">
					<Group h="100%" justify="space-between" wrap="nowrap">
						<Group gap="xl" wrap="nowrap">
							<Link to="/pages" className={styles.brand}>
								<IconChartLine size={22} />
								<span>Keyword Tracker</span>
							</Link>
							<Group gap={4} component="nav" aria-label="Main">
								{NAVIGATION.map((item) => (
									<Link
										key={item.to}
										to={item.to}
										className={styles.navLink}
										activeProps={{ className: styles.navLinkActive }}
										activeOptions={{ includeSearch: false }}
									>
										{item.label}
									</Link>
								))}
							</Group>
						</Group>
						{user && (
							<Menu position="bottom-end" width={220}>
								<Menu.Target>
									<UnstyledButton className={styles.user} aria-label="Account">
										<Group gap="xs" wrap="nowrap">
											<Avatar size="sm" radius="xl" color="indigo">
												{user.email.charAt(0).toUpperCase()}
											</Avatar>
											<Text size="sm" visibleFrom="sm" truncate>
												{user.email}
											</Text>
											<IconChevronDown size={14} />
										</Group>
									</UnstyledButton>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Label>Times shown in {user.timeZone}</Menu.Label>
									<Menu.Item
										leftSection={<IconLogout size={16} />}
										onClick={() => void handleSignOut()}
									>
										Sign out
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						)}
					</Group>
				</Container>
			</AppShell.Header>
			<AppShell.Main>
				<Container size={CONTENT_WIDTH} py="md">
					<Outlet />
				</Container>
			</AppShell.Main>
		</AppShell>
	);
}
