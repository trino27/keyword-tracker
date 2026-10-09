import { Controller, Get } from '@nestjs/common';
import type { ISearchUpdatesResponse } from '@app/contracts';
import { SearchUpdatesService } from '../../services/search-updates/search-updates.service';

/**
 * Google's ranking updates. Behind the session like every route — it holds no user's
 * data, but an anonymous endpoint that fetches from a third party on demand is an
 * amplifier for anyone who finds it.
 */
@Controller('search-updates')
export class SearchUpdatesController {
  constructor(private readonly updates: SearchUpdatesService) {}

  @Get()
  list(): Promise<ISearchUpdatesResponse> {
    return this.updates.list();
  }
}
