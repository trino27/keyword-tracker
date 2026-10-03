import { Outlet } from "@tanstack/react-router";
import styles from "./AppLayout.module.css";

/** The frame every signed-in screen renders inside. */
export function AppLayout() {
	return (
		<div className={styles.layout}>
			<header className={styles.header}>
				<span className={styles.brand}>SEO Keyword Tracker</span>
			</header>
			<main className={styles.main}>
				<Outlet />
			</main>
		</div>
	);
}
