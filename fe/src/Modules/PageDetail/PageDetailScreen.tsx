import { Skeleton, Stack } from "@mantine/core";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { todayInZone } from "@app/contracts";
import type { TPageDetailSearch } from "@App/Router/SearchSchemas/PageDetailSearchSchema/pageDetailSearchSchema";
import { NotFound } from "@Modules/_Shared/NotFound/NotFound";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import { usePageDetailViewModel } from "@ViewModels/PageDetailViewModel/PageDetailViewModel";
import { resolveRange } from "@ViewModels/PageDetailViewModel/Services/ResolveRange/resolveRange";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import { IssuesSection } from "./IssuesSection/IssuesSection";
import { KpiCards } from "./KpiCards/KpiCards";
import { PageDetailHeader } from "./PageDetailHeader/PageDetailHeader";
import { PositionHistory } from "./PositionHistory/PositionHistory";

/** One page: header with summary metrics, then its position history, then its issues. */
export function PageDetailScreen() {
	const { pageId: rawPageId } = useParams({ from: "/app/pages/$pageId" });
	const search = useSearch({ from: "/app/pages/$pageId" });
	const navigate = useNavigate({ from: "/pages/$pageId" });
	const timeZone = useSessionViewModel((state) => state.user?.timeZone ?? "UTC");
	const vm = usePageDetailViewModel();
	const pageId = Number(rawPageId);
	const validId = Number.isInteger(pageId) && pageId > 0;

	const range = useMemo(
		() => resolveRange(search.range, { from: search.from, to: search.to }, timeZone),
		[search.range, search.from, search.to, timeZone],
	);

	const { fetchDetail, fetchHistory } = vm;
	useEffect(() => {
		if (validId) void fetchDetail(pageId);
	}, [validId, pageId, fetchDetail]);

	useEffect(() => {
		if (validId) void fetchHistory(pageId, range);
	}, [validId, pageId, range, fetchHistory]);

	const update = (change: Partial<TPageDetailSearch>) =>
		void navigate({ search: (previous) => ({ ...previous, ...change }), replace: true });

	if (!validId || vm.notFound) return <NotFound what="This page" />;
	if (vm.detailStatus === "error" && vm.detailError) {
		return <SectionError message={vm.detailError} onRetry={() => void fetchDetail(pageId)} />;
	}
	if (!vm.detail || vm.detail.page.id !== pageId) {
		return (
			<Stack gap="md">
				<Skeleton height={28} width="50%" />
				<Skeleton height={16} width="70%" />
				<Skeleton height={96} />
			</Stack>
		);
	}

	const hidden = search.hidden ?? [];
	return (
		<Stack gap="xl">
			<Stack gap="md">
				<PageDetailHeader detail={vm.detail} timeZone={timeZone} />
				<KpiCards detail={vm.detail} />
			</Stack>
			<PositionHistory
				history={vm.history}
				status={vm.historyStatus}
				error={vm.historyError}
				preset={search.range}
				range={range}
				today={todayInZone(new Date(), timeZone)}
				view={search.view}
				hidden={hidden}
				onPreset={(preset) =>
					update(
						preset === "custom"
							? { range: preset, from: range.from, to: range.to }
							: { range: preset, from: undefined, to: undefined },
					)
				}
				onCustom={({ from, to }) => update({ range: "custom", from, to })}
				onView={(view) => update({ view })}
				onToggle={(keywordId) =>
					update({
						hidden: hidden.includes(keywordId)
							? hidden.filter((id) => id !== keywordId)
							: [...hidden, keywordId],
					})
				}
				onRetry={() => void fetchHistory(pageId, range)}
			/>
			<IssuesSection issues={vm.detail.issues} />
		</Stack>
	);
}
