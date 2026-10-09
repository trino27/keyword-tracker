import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { ISearchUpdate, ISearchUpdatesResponse } from '@app/contracts';
import { RemoteApiCore } from '@infrastructure/remote-api/remote-api.core';
import {
  SEARCH_STATUS_FEED,
  SEARCH_UPDATES_LIMITS,
} from '../../constants/search-status.constant';
import { parseIncidents } from '../parse-incidents/parse-incidents';

interface ICached {
  /** When the dashboard was last asked, successfully or not. */
  at: number;
  /** The last list read successfully; null until one has been. */
  updates: ISearchUpdate[] | null;
}

/**
 * Google's announced ranking updates, so a position chart can show when one ran — the
 * first question to ask of a drop (did it coincide with an update?).
 *
 * The same for every user and changed a few times a year, so it is held in memory and
 * the dashboard is asked at most every few hours. Never fatal: when the dashboard cannot
 * be read the last good list is served, and before there is one the answer says
 * `available: false` instead of claiming no updates happened.
 */
@Injectable()
export class SearchUpdatesService {
  private cached: ICached | null = null;

  constructor(
    private readonly http: RemoteApiCore,
    @InjectPinoLogger(SearchUpdatesService.name)
    private readonly logger: PinoLogger,
  ) {}

  async list(): Promise<ISearchUpdatesResponse> {
    const now = Date.now();
    if (this.cached && now - this.cached.at < this.maxAge(this.cached)) {
      return this.answer(this.cached.updates);
    }
    const updates = await this.read();
    this.cached = {
      at: now,
      updates: updates ?? this.cached?.updates ?? null,
    };
    return this.answer(this.cached.updates);
  }

  private maxAge(cached: ICached): number {
    return cached.updates === null
      ? SEARCH_UPDATES_LIMITS.retryAfterFailureMs
      : SEARCH_UPDATES_LIMITS.freshForMs;
  }

  private answer(updates: ISearchUpdate[] | null): ISearchUpdatesResponse {
    return { updates: updates ?? [], available: updates !== null };
  }

  /** The parsed feed, or null when it could not be read. */
  private async read(): Promise<ISearchUpdate[] | null> {
    try {
      const response = await this.http.get(SEARCH_STATUS_FEED, {
        maxBytes: SEARCH_UPDATES_LIMITS.feedBytes,
        accept: 'application/json',
      });
      if (response.status !== 200) {
        this.logger.warn(
          { status: response.status },
          'search status feed answered without the list',
        );
        return null;
      }
      return parseIncidents(JSON.parse(response.body.toString('utf8')));
    } catch (error) {
      this.logger.warn({ err: error }, 'search status feed could not be read');
      return null;
    }
  }
}
