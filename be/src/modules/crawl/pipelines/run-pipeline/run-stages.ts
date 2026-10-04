/**
 * The four stages of one crawl run, in the order they happen. A run that is slow or
 * that died is slow or dead somewhere, and "somewhere" is one of these.
 */
export const CRAWL_STAGES = [
  'discovery',
  'fetch',
  'analysis',
  'persist',
] as const;

export type TCrawlStage = (typeof CRAWL_STAGES)[number];

/**
 * Names the stages of a run and times them, so one log line says where the time went
 * and a failure says what it was doing.
 *
 * It is a timer and nothing else: it does not order the stages, decide them or hold
 * their results. The executor still reads as the procedure it is — that order is the
 * one rule of a run that must stay visible (all network before the transaction opens),
 * and a list of stages that could be reordered would hide it.
 */
export class RunStages {
  private readonly elapsed = new Map<TCrawlStage, number>();
  private active: TCrawlStage | null = null;

  /** The stage running now, or the last one that ran; null before the first. */
  get current(): TCrawlStage | null {
    return this.active;
  }

  /** Milliseconds per completed stage, in stage order. A stage that threw is absent. */
  get timings(): Partial<Record<TCrawlStage, number>> {
    const timings: Partial<Record<TCrawlStage, number>> = {};
    for (const stage of CRAWL_STAGES) {
      const ms = this.elapsed.get(stage);
      if (ms !== undefined) timings[stage] = ms;
    }
    return timings;
  }

  /** Runs the work as this stage; the stage's own result and errors pass through. */
  async run<T>(stage: TCrawlStage, work: () => Promise<T> | T): Promise<T> {
    this.active = stage;
    const started = Date.now();
    try {
      return await work();
    } finally {
      this.elapsed.set(stage, Date.now() - started);
    }
  }
}
