import { defineCheck, fails, PASS } from '../check.interface';

/** What the response itself says, before any markup is read. */
export const NOT_HTTPS_CHECK = defineCheck('NOT_HTTPS', ({ finalUrl }) =>
  finalUrl.startsWith('http:') ? fails({ url: finalUrl }) : PASS,
);
