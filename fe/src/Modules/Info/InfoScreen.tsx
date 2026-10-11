import { Button, Stack } from "@mantine/core";
import { useScrollSpy } from "@mantine/hooks";
import { IconBook2, IconSearchOff } from "@tabler/icons-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useMemo } from "react";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { PageHeader } from "@Modules/_Shared/PageHeader/PageHeader";
import { guideViewOf } from "@ViewModels/InfoGuideViewModel/Services/GuideViewOf/guideViewOf";
import { BeyondTracker } from "./Articles/BeyondTracker";
import { CoreWebVitalsGuide } from "./Articles/CoreWebVitalsGuide";
import { HowPagesAreJudged } from "./Articles/HowPagesAreJudged";
import { LighthouseOverview } from "./Articles/LighthouseOverview";
import { SeoFundamentals } from "./Articles/SeoFundamentals";
import { UsingTracker } from "./Articles/UsingTracker";
import { CheckReference } from "./CheckReference/CheckReference";
import { GuideNav } from "./GuideNav/GuideNav";
import { GuidePart } from "./GuidePart/GuidePart";
import { ANCHOR_ATTRIBUTE, CHECK_REFERENCE_TITLE, LIGHTHOUSE_TITLE } from "./guideOutline";
import styles from "./InfoScreen.module.scss";

/** Where the active heading is judged from: just under the fixed header. */
const SPY_OFFSET = 100;

/**
 * The guide to everything the tracker does and the SEO behind it: how it crawls and
 * judges a page, what every check, score, keyword, position and speed number means, what
 * is good and bad and why, and the sources that say so — with what it does not cover.
 * Static: it reads the catalogues the checks themselves read, and nothing from the API.
 */
export function InfoScreen() {
	const { q } = useSearch({ from: "/app/info" });
	const navigate = useNavigate({ from: "/info" });
	const view = useMemo(() => guideViewOf(q), [q]);

	const spy = useScrollSpy({ selector: `[${ANCHOR_ATTRIBUTE}]`, offset: SPY_OFFSET });
	// The headings on screen change with the search, so the spy must read them again — but
	// only then: `reinitialize` is a new function on every render and sets state, so as an
	// effect dependency it re-ran the effect forever and froze the screen.
	const rereadHeadings = useEffectEvent(() => spy.reinitialize());
	useEffect(() => rereadHeadings(), [view]);
	const activeId = spy.data[spy.active]?.id ?? null;

	const search = (next: string | undefined) =>
		void navigate({ search: next ? { q: next } : {}, replace: true });
	const jump = (id: string) =>
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

	return (
		<>
			<PageHeader
				title="Info"
				description="How the tracker works and how to read it: every check, the score, keywords, positions and Core Web Vitals — what is good, what is bad, why it matters, how to fix it, and the sources that say so."
			/>
			<div className={styles.layout}>
				<aside className={styles.aside} aria-label="Guide navigation">
					<GuideNav
						reference={view.kind === "noResults" ? [] : view.reference}
						lighthouse={view.kind === "noResults" ? [] : view.lighthouse}
						withChapters={view.kind === "all"}
						activeId={activeId}
						onJump={jump}
						query={q}
						onSearch={search}
					/>
				</aside>

				<Stack gap="xl" className={styles.content}>
					{view.kind === "all" && (
						<>
							<UsingTracker />
							<HowPagesAreJudged />
							<SeoFundamentals />
							<CoreWebVitalsGuide />
							<GuidePart
								title={CHECK_REFERENCE_TITLE}
								lead="Every check the tracker runs, chapter by chapter. Open one to see when it passes, fails or is skipped, what passing gains and failing costs, an example of the right markup, how the tracker checks it and how to check it yourself, how to fix it, and the sources behind it."
							>
								<CheckReference topics={view.reference} expanded={false} />
							</GuidePart>
							<GuidePart
								title={LIGHTHOUSE_TITLE}
								lead="Google Lighthouse's own SEO and accessibility audits, grouped by what they examine — and, where we check the same thing, how the two readings differ."
							>
								<LighthouseOverview />
								<CheckReference topics={view.lighthouse} expanded={false} />
							</GuidePart>
							<BeyondTracker />
						</>
					)}
					{view.kind === "results" && (
						<GuidePart
							title={`${view.matched} ${view.matched === 1 ? "check matches" : "checks match"} “${q}”`}
						>
							{/* Keyed by the search: the cards open on mount, so each new search opens its own. */}
							<CheckReference
								key={q}
								topics={[...view.reference, ...view.lighthouse]}
								expanded
							/>
						</GuidePart>
					)}
					{view.kind === "noResults" && (
						<EmptyState
							icon={<IconSearchOff size={22} />}
							title={`No check matches “${q}”`}
							description="Search looks in each check's name, code and explanation. Try a broader word, such as title, image or redirect."
							action={
								<Button
									variant="light"
									leftSection={<IconBook2 size={16} />}
									onClick={() => search(undefined)}
								>
									Show the whole guide
								</Button>
							}
						/>
					)}
				</Stack>
			</div>
		</>
	);
}
