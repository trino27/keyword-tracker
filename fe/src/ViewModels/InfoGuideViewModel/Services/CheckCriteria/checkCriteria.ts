import type { TGuideCode } from "@Core/Constants/checkTopics";
import type { ICheckCriteria } from "./criteriaShape";
import { CONTENT_AND_CANONICAL_CRITERIA } from "./groups/contentAndCanonical";
import { INDEXING_AND_LINKS_CRITERIA } from "./groups/indexingAndLinks";
import { LIGHTHOUSE_CRITERIA } from "./groups/lighthouse";
import { MEDIA_LANGUAGE_SHARING_CRITERIA } from "./groups/mediaLanguageSharing";
import { SECURITY_AND_PERFORMANCE_CRITERIA } from "./groups/securityAndPerformance";
import { DESKTOP_CWV_CRITERIA, SPEED_AND_SITE_CRITERIA } from "./groups/speedAndSite";
import { STRUCTURED_DATA_AND_IDENTITY_CRITERIA } from "./groups/structuredDataAndIdentity";
import { TITLES_AND_HEADINGS_CRITERIA } from "./groups/titlesAndHeadings";

/**
 * Everything the guide says about every check beyond the catalogue: when it passes and
 * fails, what passing gains, an example, how the tracker's code decides, and how to check
 * it by hand. When a check is skipped, what failing costs and the sources are the
 * catalogue's own, and are not repeated here.
 *
 * Typed as a `Record` over every code, so a check added to either catalogue without its
 * entry in one of the groups does not compile. The groups are split by chapter only so
 * that each stays readable; together they must cover the catalogues exactly.
 */
export const CHECK_CRITERIA: Record<TGuideCode, ICheckCriteria> = {
	...TITLES_AND_HEADINGS_CRITERIA,
	...CONTENT_AND_CANONICAL_CRITERIA,
	...INDEXING_AND_LINKS_CRITERIA,
	...MEDIA_LANGUAGE_SHARING_CRITERIA,
	...SECURITY_AND_PERFORMANCE_CRITERIA,
	...STRUCTURED_DATA_AND_IDENTITY_CRITERIA,
	...SPEED_AND_SITE_CRITERIA,
	...DESKTOP_CWV_CRITERIA,
	...LIGHTHOUSE_CRITERIA,
};
