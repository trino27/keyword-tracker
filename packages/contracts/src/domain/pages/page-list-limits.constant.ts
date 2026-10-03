/** Page sizes the list offers; the API refuses anything above MAX_PAGE_SIZE. */
export const PAGE_SIZE_OPTIONS = [20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

/** The longest search the list accepts. */
export const MAX_PAGE_SEARCH_LENGTH = 200;
