import type { IPageListItem } from './page-list-item.interface.js';

export interface IPageListResponse {
  items: IPageListItem[];
  /** 1-based. */
  page: number;
  pageSize: number;
  /** Rows matching the filters, across all pages. */
  total: number;
}
