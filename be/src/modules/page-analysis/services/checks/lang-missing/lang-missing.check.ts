import { defineCheck, fails, PASS } from '../check.interface';

export const LANG_MISSING_CHECK = defineCheck('LANG_MISSING', ({ parsed }) =>
  parsed.lang === null ? fails({}) : PASS,
);
