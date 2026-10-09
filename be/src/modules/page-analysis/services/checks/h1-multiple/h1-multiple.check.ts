import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

export const H1_MULTIPLE_CHECK = defineCheck('H1_MULTIPLE', ({ parsed }) =>
  parsed.h1s.length > 1
    ? fails({
        count: parsed.h1s.length,
        evidence: evidence(parsed.h1s.map((text) => `<h1>${text}</h1>`)),
      })
    : PASS,
);
