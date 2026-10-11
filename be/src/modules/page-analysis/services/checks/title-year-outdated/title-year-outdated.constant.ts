/**
 * The words after which a year means "this is current as of": "tools for 2025", "trends
 * in 2025", "тренды в 2025". Tunable; a preposition joins when a page in the field audit
 * uses one the list misses (plan O1).
 */
export const YEAR_PREPOSITIONS = ['in', 'for', 'в'] as const;

/**
 * What may follow a year that ends the title: a closing bracket or a colon or a full
 * stop — "Checklist (2024)", "Guide 2024:" — and Russian «году»/«год», which follows the
 * year in "в 2025 году".
 */
export const YEAR_TRAILERS = /^[\s)\]:.!?]*(?:год[ау]?)?[\s)\]:.!?]*$/iu;
