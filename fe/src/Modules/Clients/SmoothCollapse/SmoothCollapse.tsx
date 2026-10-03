import { useReducedMotion } from "@mantine/hooks";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./SmoothCollapse.module.scss";

const DURATION_MS = 220;

interface ISmoothCollapseProps {
	expanded: boolean;
	/** Mounted on the first expand, unmounted once the closing animation has finished. */
	children: ReactNode;
}

/**
 * A height transition that keeps following its content.
 *
 * Mantine's `Collapse` measures once per toggle, so the two things this row does break it:
 * the run log arrives after the open animation (the row snaps to its full height), and the
 * caller used to unmount the log on close (nothing left to animate, so the row vanished in
 * one frame). Here the children stay mounted for the whole closing transition and a
 * ResizeObserver re-measures them, so loading, loaded and closing are all animated.
 */
export function SmoothCollapse({ expanded, children }: ISmoothCollapseProps) {
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState(0);
	const [mounted, setMounted] = useState(expanded);
	const reducedMotion = useReducedMotion();
	const duration = reducedMotion ? 0 : DURATION_MS;

	if (expanded && !mounted) setMounted(true);

	useEffect(() => {
		if (expanded) return;
		// Kept past the transition so the close animates; a timer rather than `transitionend`,
		// which never fires when the duration is zero or the height did not change.
		const timer = window.setTimeout(() => setMounted(false), duration);
		return () => window.clearTimeout(timer);
	}, [expanded, duration]);

	useLayoutEffect(() => {
		const node = contentRef.current;
		if (!node) return;
		const measure = () => setContentHeight(node.offsetHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, [mounted]);

	return (
		<div
			className={`${styles.viewport} ${mounted ? styles.divided : ""}`}
			style={{ height: expanded ? contentHeight : 0, transitionDuration: `${duration}ms` }}
			aria-hidden={!expanded}
			inert={!expanded}
		>
			<div ref={contentRef}>{mounted ? children : null}</div>
		</div>
	);
}
