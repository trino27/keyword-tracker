import {
  insertAfter,
  insertBefore,
  replaceStep,
  runPipeline,
  stepNames,
  without,
  type IPipelineStep,
} from './pipeline';

interface ICtx {
  trace: string[];
}

const step = (name: string): IPipelineStep<ICtx> => ({
  name,
  run: (context) => {
    context.trace.push(name);
  },
});

/** What a model or a network call looks like from here: a step that takes a turn. */
const asyncStep = (name: string): IPipelineStep<ICtx> => ({
  name,
  run: async (context) => {
    await Promise.resolve();
    context.trace.push(name);
  },
});

const BASE = [step('collect'), step('score'), step('select')];

describe('runPipeline', () => {
  it('runs the steps in order', async () => {
    const context = await runPipeline({ trace: [] }, BASE);
    expect(context.trace).toEqual(['collect', 'score', 'select']);
  });

  it('awaits an async step before starting the next', async () => {
    // The reason the runner is async at all: a step that calls out to a model must
    // finish writing the context before the step that reads it begins.
    const pipeline = insertAfter(BASE, 'score', asyncStep('rerank'));
    const context = await runPipeline({ trace: [] }, pipeline);
    expect(context.trace).toEqual(['collect', 'score', 'rerank', 'select']);
  });

  it('lets a sync and an async step sit side by side', async () => {
    const pipeline = [asyncStep('a'), step('b'), asyncStep('c')];
    const context = await runPipeline({ trace: [] }, pipeline);
    expect(context.trace).toEqual(['a', 'b', 'c']);
  });

  it('propagates a step failure rather than finishing the run', async () => {
    const failing: IPipelineStep<ICtx> = {
      name: 'model',
      run: () => Promise.reject(new Error('model unavailable')),
    };
    const pipeline = insertBefore(BASE, 'select', failing);
    await expect(runPipeline({ trace: [] }, pipeline)).rejects.toThrow(
      'model unavailable',
    );
  });
});

describe('composing a pipeline', () => {
  it('inserts after a named step', () => {
    expect(stepNames(insertAfter(BASE, 'score', step('rerank')))).toEqual([
      'collect',
      'score',
      'rerank',
      'select',
    ]);
  });

  it('inserts before a named step', () => {
    expect(stepNames(insertBefore(BASE, 'collect', step('stem')))).toEqual([
      'stem',
      'collect',
      'score',
      'select',
    ]);
  });

  it('inserts several at once, in the order given', () => {
    expect(
      stepNames(insertAfter(BASE, 'collect', step('stem'), step('fold'))),
    ).toEqual(['collect', 'stem', 'fold', 'score', 'select']);
  });

  it('replaces a named step, which is how a language specialises one', () => {
    expect(stepNames(replaceStep(BASE, 'collect', step('collect-ja')))).toEqual(
      ['collect-ja', 'score', 'select'],
    );
  });

  it('removes a named step', () => {
    expect(stepNames(without(BASE, 'score'))).toEqual(['collect', 'select']);
  });

  it('never mutates the pipeline it was given', () => {
    insertAfter(BASE, 'score', step('rerank'));
    without(BASE, 'score');
    expect(stepNames(BASE)).toEqual(['collect', 'score', 'select']);
  });

  it('refuses an anchor no step carries, and names the ones that exist', () => {
    // A typo that silently left the pipeline unchanged would be a step that never
    // ran, found later as a quality regression with nothing in the logs about it.
    expect(() => insertAfter(BASE, 'scoer', step('rerank'))).toThrow(
      /No pipeline step named "scoer"; this pipeline has: collect, score, select/,
    );
  });
});
