import { Injectable } from '@nestjs/common';

/**
 * What the PageSpeed worker learned at run time that every read path must report: that
 * Google refused the key. Process memory, reset by a restart — which is also the cure,
 * once the key in `.env` is fixed. Lives beside the settings, not in the worker's module,
 * so the pages and report code read it without importing the worker.
 */
@Injectable()
export class PageSpeedRuntimeState {
  private rejected = false;

  get keyRejected(): boolean {
    return this.rejected;
  }

  markKeyRejected(): void {
    this.rejected = true;
  }
}
