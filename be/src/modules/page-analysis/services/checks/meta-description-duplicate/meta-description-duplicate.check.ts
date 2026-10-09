import { normalizeText } from '../../text/normalize-text/normalize-text';
import { duplicatesOf, type TValueOf } from '../_shared/duplicates-of';
import { attribute, evidence } from '../_shared/evidence';
import { defineRunCheck } from '../check.interface';

const descriptionOf: TValueOf = (input, index) => {
  const description = normalizeText(
    input.pages[index].parsed.metaDescription ?? '',
  );
  return description.length > 0 ? description : null;
};

/** A description written for one page describes the others worse. */
export const META_DESCRIPTION_DUPLICATE_CHECK = defineRunCheck(
  'META_DESCRIPTION_DUPLICATE',
  (input) =>
    duplicatesOf(input, descriptionOf, (_, others, index) => ({
      otherUrls: others,
      evidence: evidence([
        `<meta name="description" content="${attribute(input.pages[index].parsed.metaDescription ?? '')}"> — the same on ${others.length} other page${others.length === 1 ? '' : 's'}`,
      ]),
    })),
);
