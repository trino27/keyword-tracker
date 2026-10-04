import { defineCheck, fails, PASS } from '../check.interface';

export const REDIRECTED_CHECK = defineCheck(
  'REDIRECTED',
  ({ url, finalUrl, redirected }) =>
    redirected ? fails({ from: url, to: finalUrl }) : PASS,
);
