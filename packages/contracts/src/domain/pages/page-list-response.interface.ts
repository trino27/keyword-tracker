import type { IPageListItem } from './page-list-item.interface.js';
import type { IPageSpeedAvailability } from '../page-speed/page-speed-availability.interface.js';

export interface IPageListResponse {
  items: IPageListItem[];
  /** 1-based. */
  page: number;
  pageSize: number;
  /** Rows matching the filters, across all pages. */
  total: number;
  /** Whether PageSpeed can measure at all — what an empty badge cell means. */
  pageSpeedAvailability: IPageSpeedAvailability;
}
