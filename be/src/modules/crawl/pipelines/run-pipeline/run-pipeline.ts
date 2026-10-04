import { InvariantViolationException } from '@core/exceptions/invariant-violation-exception/invariant-violation.exception';
import type { IClaimedRun } from '@modules/clients/interfaces/client-record.interface';
import type { IRunContext, IRunStep } from './run-step.interface';
import type { RunStages } from './run-stages';

/** A context no step has written to yet. */
export function emptyRunContext(
  run: IClaimedRun,
  signal: AbortSignal,
): IRunContext {
  return {
    run,
    signal,
    target: null,
    discovery: null,
    selection: null,
    pages: null,
    outcome: null,
  };
}

/**
 * The order of a crawl run, checked before it runs: network first, one write last.
 *
 * A pipeline whose transaction is not its last step would hold a database connection
 * open across a site's slowest page — the one thing this design exists to prevent —
 * and it would do so silently. Here it cannot start.
 */
export function assertRunPipeline(
  steps: readonly IRunStep[],
): readonly IRunStep[] {
  const writers = steps.filter((step) => step.opensTransaction);
  if (writers.length !== 1 || writers[0] !== steps[steps.length - 1]) {
    throw new InvariantViolationException(
      'A crawl run pipeline must end with exactly one step that opens the transaction.',
      { steps: steps.map((step) => step.name), writers: writers.length },
    );
  }
  return steps;
}

/**
 * Runs the stages in order over one context, timing each. Nothing is caught here: a
 * step that throws ends the run, and the caller writes the failure down — which is
 * what makes a step's own body free of run-level error handling.
 */
export async function runCrawlPipeline(
  steps: readonly IRunStep[],
  context: IRunContext,
  stages: RunStages,
): Promise<IRunContext> {
  for (const step of steps) {
    await stages.run(step.name, () => step.run(context));
  }
  return context;
}
