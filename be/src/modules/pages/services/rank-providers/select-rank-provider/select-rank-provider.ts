import { InvariantViolationException } from '@core/exceptions/invariant-violation-exception/invariant-violation.exception';
import type { IRankPositionProvider } from '../../../ports/rank-position-provider.port';

/**
 * Which engine serves the API, by its `id`. The default is the first provider the build
 * registers, so an unset RANK_PROVIDER is a working configuration, not a boot failure.
 *
 * An id no build has is a boot failure on purpose, and the message names what IS
 * available: the alternative is an app that silently invents positions while its
 * operator believes it is measuring them.
 */
export function selectRankProvider(
  id: string | undefined,
  available: IRankPositionProvider[],
): IRankPositionProvider {
  const wanted = id ?? available[0].id;
  const chosen = available.find((provider) => provider.id === wanted);
  if (chosen) return chosen;
  throw new InvariantViolationException(
    `Unknown RANK_PROVIDER "${wanted}"; this build has: ${available
      .map((provider) => provider.id)
      .join(', ')}`,
  );
}
