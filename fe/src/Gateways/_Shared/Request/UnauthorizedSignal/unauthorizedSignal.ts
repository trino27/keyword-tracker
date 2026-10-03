type TListener = () => void;

const listeners = new Set<TListener>();

/**
 * A 401 on an ordinary request means the session expired while the user was working.
 * Gateways announce it here; whoever owns navigation (the router, through the session
 * ViewModel) decides what happens. Gateways never navigate.
 */
export function onUnauthorized(listener: TListener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function notifyUnauthorized(): void {
	for (const listener of [...listeners]) listener();
}
