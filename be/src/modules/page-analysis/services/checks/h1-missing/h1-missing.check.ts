import { defineCheck, fails, PASS } from '../check.interface';

export const H1_MISSING_CHECK = defineCheck('H1_MISSING', ({ parsed }) =>
  parsed.h1s.length === 0 ? fails({}) : PASS,
);
