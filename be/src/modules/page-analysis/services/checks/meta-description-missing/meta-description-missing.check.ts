import { defineCheck, fails, PASS } from '../check.interface';

export const META_DESCRIPTION_MISSING_CHECK = defineCheck(
  'META_DESCRIPTION_MISSING',
  ({ parsed }) => (parsed.metaDescription === null ? fails({}) : PASS),
);
