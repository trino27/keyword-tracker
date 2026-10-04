import { defineCheck, fails, PASS } from '../check.interface';

export const CANONICAL_MISSING_CHECK = defineCheck(
  'CANONICAL_MISSING',
  ({ parsed }) => (parsed.canonical === null ? fails({}) : PASS),
);
