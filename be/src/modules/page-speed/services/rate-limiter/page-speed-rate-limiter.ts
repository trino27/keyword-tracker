import { setTimeout as delay } from 'node:timers/promises';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { PAGE_SPEED_MIN_INTERVAL_MS } from '../../constants/page-speed-worker.constant';

export interface IRateLimiterClock {
  now(): number;
  /** Resolves after `ms`, or early once `signal` aborts. Never rejects. */
  sleep(ms: number, signal: AbortSignal): Promise<void>;
}

export const RATE_LIMITER_CLOCK = Symbol('RATE_LIMITER_CLOCK');

const REAL_CLOCK: IRateLimiterClock = {
  now: () => Date.now(),
  sleep: (ms, signal) =>
    delay(ms, undefined, { signal }).catch(() => undefined),
};

/**
 * Every request to Google passes through here, from every slot: at least
 * PAGE_SPEED_MIN_INTERVAL_MS apart, none while a 429's pause runs, and none at all once
 * the key has been refused. Slots ask BEFORE claiming a row, so a paused slot holds no
 * row hostage.
 *
 * Process memory, on purpose (plan O1): right for the one API process this stack runs;
 * a second process would keep its own pause.
 */
@Injectable()
export class PageSpeedRateLimiter {
  private readonly clock: IRateLimiterClock;
  private nextAllowedAt = 0;
  private pausedUntil = 0;
  private halted = false;
  /** Turns are taken one at a time, so two slots cannot both see the gap as free. */
  private turns: Promise<unknown> = Promise.resolve();
  /** Aborted by a halt, to wake every slot that is waiting out a pause. */
  private interrupt = new AbortController();

  constructor(
    @Optional() @Inject(RATE_LIMITER_CLOCK) clock?: IRateLimiterClock,
  ) {
    this.clock = clock ?? REAL_CLOCK;
  }

  get isHalted(): boolean {
    return this.halted;
  }

  /** True: send now. False: the queue is halted, or the caller stopped waiting. */
  acquire(signal?: AbortSignal): Promise<boolean> {
    const turn = this.turns.then(() => this.waitTurn(signal));
    this.turns = turn.catch(() => undefined);
    return turn;
  }

  /** Holds every slot until `ms` from now; a longer pause already running is kept. */
  pause(ms: number): void {
    this.pausedUntil = Math.max(this.pausedUntil, this.clock.now() + ms);
  }

  /** Stops every pending and future `acquire()` — the key was refused. */
  halt(): void {
    this.halted = true;
    this.interrupt.abort();
  }

  private async waitTurn(signal?: AbortSignal): Promise<boolean> {
    for (;;) {
      if (this.halted || signal?.aborted) return false;
      const wait =
        Math.max(this.nextAllowedAt, this.pausedUntil) - this.clock.now();
      if (wait <= 0) {
        this.nextAllowedAt = this.clock.now() + PAGE_SPEED_MIN_INTERVAL_MS;
        return true;
      }
      const wake = signal
        ? AbortSignal.any([signal, this.interrupt.signal])
        : this.interrupt.signal;
      await this.clock.sleep(wait, wake);
    }
  }
}
