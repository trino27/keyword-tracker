import { normalizeText } from '../../text/normalize-text/normalize-text';
import { duplicatesOf, type TValueOf } from '../_shared/duplicates-of';
import { evidence } from '../_shared/evidence';
import { defineRunCheck } from '../check.interface';

const titleOf: TValueOf = (input, index) => {
  const title = normalizeText(input.pages[index].parsed.title ?? '');
  return title.length > 0 ? title : null;
};

/** Two posts with one title give a result page no way to tell them apart. */
export const TITLE_DUPLICATE_CHECK = defineRunCheck(
  'TITLE_DUPLICATE',
  (input) =>
    duplicatesOf(input, titleOf, (_, others, index) => ({
      otherUrls: others,
      evidence: evidence([
        `<title>${input.pages[index].parsed.title ?? ''}</title> — the same on ${others.length} other page${others.length === 1 ? '' : 's'}`,
      ]),
    })),
);
