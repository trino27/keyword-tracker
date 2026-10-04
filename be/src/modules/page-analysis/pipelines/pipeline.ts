/**
 * What a pipeline IS, for every pipeline in this module.
 *
 * Both pipelines here were the same four ideas written twice — a named step, an
 * ordered list of them, a context they fill in turn, and a runner that takes the list
 * as a parameter so an experiment runs beside the default. This is those ideas once,
 * typed by the context, so a change to what a step may do is a change in one file.
 *
 * The step is the unit of extension on purpose: the work ahead of this module is a
 * stemmer per language, a language profile, a model that re-ranks candidates, and
 * run-level checks the analysis does not do yet. Each is one entry in a list, added
 * where it belongs by `insertAfter` rather than by editing the list itself.
 */

/**
 * One step, named, over a context it fills.
 *
 * `run` may return a promise, and a step that has no I/O simply does not. That is
 * what lets a model step — a network call per run — sit in the same list as
 * `collect`, which is arithmetic over strings, without either knowing about the
 * other. The runner awaits every step, and awaiting a non-promise costs a tick.
 *
 * A step is pure in everything but the context: it reads what earlier steps left and
 * writes its own field. Two steps writing one field is the one thing that makes the
 * order of this list load-bearing, and the comments on each context say which step
 * owns which field.
 */
export interface IPipelineStep<TContext> {
  readonly name: string;
  run(context: TContext): void | Promise<void>;
}

export type TPipeline<TContext> = readonly IPipelineStep<TContext>[];

/** Runs the steps in order over one context and hands it back filled. */
export async function runPipeline<TContext>(
  context: TContext,
  steps: TPipeline<TContext>,
): Promise<TContext> {
  for (const step of steps) await step.run(context);
  return context;
}

/** The names in order — what a pipeline reads as, and what a test asserts on. */
export const stepNames = <TContext>(steps: TPipeline<TContext>): string[] =>
  steps.map((step) => step.name);

/**
 * An anchor name no step carries. It is an error rather than a no-op: a misspelled
 * anchor that silently left the pipeline unchanged would be a step that never ran,
 * found later as a quality regression with nothing in the logs about it.
 */
class UnknownStepError extends Error {
  constructor(name: string, steps: string[]) {
    super(
      `No pipeline step named "${name}"; this pipeline has: ${steps.join(', ')}`,
    );
    this.name = 'UnknownStepError';
  }
}

function indexOf<TContext>(steps: TPipeline<TContext>, name: string): number {
  const at = steps.findIndex((step) => step.name === name);
  if (at < 0) throw new UnknownStepError(name, stepNames(steps));
  return at;
}

/** A copy of `steps` with `step` immediately after the one named `name`. */
export function insertAfter<TContext>(
  steps: TPipeline<TContext>,
  name: string,
  ...added: TPipeline<TContext>
): TPipeline<TContext> {
  const at = indexOf(steps, name);
  return [...steps.slice(0, at + 1), ...added, ...steps.slice(at + 1)];
}

/** A copy of `steps` with `step` immediately before the one named `name`. */
export function insertBefore<TContext>(
  steps: TPipeline<TContext>,
  name: string,
  ...added: TPipeline<TContext>
): TPipeline<TContext> {
  const at = indexOf(steps, name);
  return [...steps.slice(0, at), ...added, ...steps.slice(at)];
}

/**
 * A copy of `steps` with the one named `name` swapped for `step`.
 *
 * This is how a step is specialised rather than appended: a language that needs its
 * own candidate collection replaces `collect`, and every later step reads the context
 * it left without knowing which implementation filled it.
 */
export function replaceStep<TContext>(
  steps: TPipeline<TContext>,
  name: string,
  step: IPipelineStep<TContext>,
): TPipeline<TContext> {
  const at = indexOf(steps, name);
  return [...steps.slice(0, at), step, ...steps.slice(at + 1)];
}

/** A copy of `steps` without the one named `name`. */
export function without<TContext>(
  steps: TPipeline<TContext>,
  name: string,
): TPipeline<TContext> {
  const at = indexOf(steps, name);
  return [...steps.slice(0, at), ...steps.slice(at + 1)];
}
