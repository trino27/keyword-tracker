import { InvariantViolationException } from '@core/exceptions/invariant-violation-exception/invariant-violation.exception';
import type { IClaimedRun } from '@modules/clients/interfaces/client-record.interface';
import {
  assertRunPipeline,
  emptyRunContext,
  runCrawlPipeline,
} from './run-pipeline';
import { RunStages } from './run-stages';
import type { IRunStep } from './run-step.interface';

const RUN = { id: 7, attempts: 1 } as IClaimedRun;

const step = (
  name: IRunStep['name'],
  body: () => void = () => undefined,
  opensTransaction = false,
): IRunStep => ({
  name,
  opensTransaction,
  run: () => {
    body();
    return Promise.resolve();
  },
});

describe('assertRunPipeline', () => {
  it('accepts a pipeline whose single writer is last', () => {
    const steps = [step('discovery'), step('persist', undefined, true)];
    expect(assertRunPipeline(steps)).toBe(steps);
  });

  it('refuses a pipeline that would hold the transaction across the network', () => {
    expect(() =>
      assertRunPipeline([step('persist', undefined, true), step('fetch')]),
    ).toThrow(InvariantViolationException);
  });

  it('refuses two writers, and none at all', () => {
    expect(() =>
      assertRunPipeline([
        step('analysis', undefined, true),
        step('persist', undefined, true),
      ]),
    ).toThrow(InvariantViolationException);
    expect(() => assertRunPipeline([step('discovery')])).toThrow(
      InvariantViolationException,
    );
  });
});

describe('runCrawlPipeline', () => {
  it('runs the steps in order and times each of them', async () => {
    const order: string[] = [];
    const steps = [
      step('discovery', () => order.push('discovery')),
      step('fetch', () => order.push('fetch')),
      step('persist', () => order.push('persist'), true),
    ];
    const stages = new RunStages();

    await runCrawlPipeline(
      steps,
      emptyRunContext(RUN, new AbortController().signal),
      stages,
    );

    expect(order).toEqual(['discovery', 'fetch', 'persist']);
    expect(Object.keys(stages.timings)).toEqual([
      'discovery',
      'fetch',
      'persist',
    ]);
    expect(stages.current).toBe('persist');
  });

  it('hands a step what the steps before it wrote', async () => {
    const seen: unknown[] = [];
    const steps: IRunStep[] = [
      {
        name: 'discovery',
        run: (context) => {
          context.target = {
            clientId: 1,
            websiteUrl: 'https://a.example',
            siteKey: 'a.example',
          };
          return Promise.resolve();
        },
      },
      {
        name: 'fetch',
        run: (context) => {
          seen.push(context.target?.siteKey);
          return Promise.resolve();
        },
      },
    ];

    await runCrawlPipeline(
      steps,
      emptyRunContext(RUN, new AbortController().signal),
      new RunStages(),
    );

    expect(seen).toEqual(['a.example']);
  });

  it('stops at a throwing step, and says which one it was', async () => {
    const after = jest.fn();
    const stages = new RunStages();
    const steps = [
      step('discovery'),
      step('fetch', () => {
        throw new Error('site timed out');
      }),
      step('analysis', after),
    ];

    await expect(
      runCrawlPipeline(
        steps,
        emptyRunContext(RUN, new AbortController().signal),
        stages,
      ),
    ).rejects.toThrow('site timed out');
    expect(after).not.toHaveBeenCalled();
    expect(stages.current).toBe('fetch');
    // A stage that threw is still timed: that is where the run spent itself.
    expect(stages.timings.fetch).toBeDefined();
    expect(stages.timings.analysis).toBeUndefined();
  });
});
