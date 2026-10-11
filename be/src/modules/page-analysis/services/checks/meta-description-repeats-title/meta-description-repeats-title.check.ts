import { attribute, evidence } from '../_shared/evidence';
import { titleSegments } from '../_shared/title-without-brand';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** Case, width, punctuation and spacing are not what makes two sentences different. */
const normalise = (text: string): string =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * A description that says nothing the title does not: equal to it, or to one of its parts
 * between separators, once case and punctuation are set aside. A description that adds even a
 * clause passes — the rule is about a copy, not about a short description, which
 * META_DESCRIPTION_LENGTH judges.
 */
export const META_DESCRIPTION_REPEATS_TITLE_CHECK = defineCheck(
  'META_DESCRIPTION_REPEATS_TITLE',
  ({ parsed: { title, metaDescription } }) => {
    if (!title || !metaDescription) return NOT_APPLICABLE;
    const description = normalise(metaDescription);
    // Any part between separators: the post's name may sit before the site's or after it.
    const repeats = [title, ...titleSegments(title)].some(
      (part) => description === normalise(part),
    );
    return !repeats
      ? PASS
      : fails({
          title,
          description: metaDescription,
          evidence: evidence([
            `<title>${title}</title>`,
            `<meta name="description" content="${attribute(metaDescription)}">`,
          ]),
        });
  },
);
