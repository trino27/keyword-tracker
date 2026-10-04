import { defineCheck, fails, PASS } from '../check.interface';

export const TITLE_MISSING_CHECK = defineCheck('TITLE_MISSING', ({ parsed }) =>
  parsed.title === null ? fails({}) : PASS,
);
