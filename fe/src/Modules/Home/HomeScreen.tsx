import { useEffect } from "react";
import { useHealthViewModel } from "@ViewModels/HealthViewModel/HealthViewModel";
import styles from "./HomeScreen.module.css";

/** Placeholder start screen: proves the browser, Caddy, the API and Postgres are wired. */
export function HomeScreen() {
	const status = useHealthViewModel((state) => state.status);
	const health = useHealthViewModel((state) => state.health);
	const error = useHealthViewModel((state) => state.error);
	const load = useHealthViewModel((state) => state.load);

	useEffect(() => {
		void load();
	}, [load]);

	return (
		<section className={styles.panel}>
			<h1>System status</h1>
			{status === "loading" && <p className={styles.muted}>Checking…</p>}
			{error && <p className={styles.error}>{error}</p>}
			{health && (
				<dl className={styles.status}>
					<dt>API</dt>
					<dd data-state={health.status}>{health.status}</dd>
					<dt>Database</dt>
					<dd data-state={health.database}>{health.database}</dd>
				</dl>
			)}
		</section>
	);
}
