import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import type { IParsedPage } from '../../../interfaces/parsed-page.interface';

/**
 * Whether the main content is long enough to be asked how it is built — sections, images,
 * sources. The line is THIN_CONTENT's, read from the catalogue so the two checks that
 * talk about a post's length can never quote two different numbers: below it a post is
 * thin, and a 150-word note needs no subheading, picture or citation to be readable.
 */
export const isLongText = ({ wordCount }: Pick<IParsedPage, 'wordCount'>) =>
  wordCount >= SEO_ISSUE_CATALOGUE.THIN_CONTENT.min;
