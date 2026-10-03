import { Group, Pagination, Select, Text } from "@mantine/core";
import { PAGE_SIZE_OPTIONS } from "@app/contracts";

interface IPagesPaginationProps {
	page: number;
	pageSize: number;
	total: number;
	onPage: (page: number) => void;
	onPageSize: (pageSize: number) => void;
}

/** Below the table, the data-table convention: page numbers, then rows per page. */
export function PagesPagination({
	page,
	pageSize,
	total,
	onPage,
	onPageSize,
}: IPagesPaginationProps) {
	const pages = Math.max(1, Math.ceil(total / pageSize));
	return (
		<Group justify="space-between" gap="sm">
			<Group gap="xs">
				<Text size="sm" c="dimmed">
					Rows per page
				</Text>
				<Select
					aria-label="Rows per page"
					data={PAGE_SIZE_OPTIONS.map(String)}
					value={String(pageSize)}
					onChange={(value) => value && onPageSize(Number(value))}
					allowDeselect={false}
					w={80}
					size="xs"
				/>
			</Group>
			{pages > 1 && (
				<Pagination value={page} total={pages} onChange={onPage} size="sm" withEdges />
			)}
		</Group>
	);
}
