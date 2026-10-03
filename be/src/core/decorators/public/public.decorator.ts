import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of the global session guard. Everything else is denied by default,
 * and an e2e test enumerates the public routes, so adding this decorator is a decision
 * the suite makes visible.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
