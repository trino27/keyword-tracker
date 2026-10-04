import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@modules/clients/clients.module';
import { EnvKeys } from '@infrastructure/config/env-keys.constant';
import {
  RANK_POSITION_PROVIDER,
  type IRankPositionProvider,
} from './ports/rank-position-provider.port';
import { PagesController } from './controllers/pages/pages.controller';
import { PositionsController } from './controllers/positions/positions.controller';
import { KeywordsRepository } from './repositories/keywords/keywords.repository';
import { PageKeywordsRepository } from './repositories/page-keywords/page-keywords.repository';
import { PageDetailRepository } from './repositories/page-detail/page-detail.repository';
import { PageListRepository } from './repositories/page-list/page-list.repository';
import { PagesRepository } from './repositories/pages/pages.repository';
import { RankSnapshotsRepository } from './repositories/rank-snapshots/rank-snapshots.repository';
import { SeoIssuesRepository } from './repositories/seo-issues/seo-issues.repository';
import { CrawlResultsService } from './services/crawl-results/crawl-results.service';
import { PageReadService } from './services/page-read/page-read.service';
import { PositionFillService } from './services/position-fill/position-fill.service';
import { PositionHistoryService } from './services/position-history/position-history.service';
import { selectRankProvider } from './services/rank-providers/select-rank-provider/select-rank-provider';
import { SimulatedRankProvider } from './services/rank-providers/simulated-rank-provider/simulated-rank-provider.service';
import { SnapshotWriterService } from './services/snapshot-writer/snapshot-writer.service';

/**
 * Every rank provider this build can be switched to. A new engine is a class that
 * implements the port, one entry here, and its `id` in RANK_PROVIDER — nothing that
 * reads or writes positions changes.
 */
const RANK_PROVIDERS = [SimulatedRankProvider];

/** Owns pages, keywords, page_keywords, seo_issues and rank_snapshots. */
@Module({
  imports: [ClientsModule],
  controllers: [PagesController, PositionsController],
  providers: [
    PagesRepository,
    PageListRepository,
    PageDetailRepository,
    KeywordsRepository,
    PageKeywordsRepository,
    SeoIssuesRepository,
    RankSnapshotsRepository,
    CrawlResultsService,
    SnapshotWriterService,
    PageReadService,
    PositionHistoryService,
    PositionFillService,
    ...RANK_PROVIDERS,
    {
      provide: RANK_POSITION_PROVIDER,
      inject: [ConfigService, ...RANK_PROVIDERS],
      useFactory: (
        config: ConfigService,
        ...available: IRankPositionProvider[]
      ) =>
        selectRankProvider(
          config.get<string>(EnvKeys.RANK_PROVIDER),
          available,
        ),
    },
  ],
  exports: [
    CrawlResultsService,
    SnapshotWriterService,
    PositionFillService,
    // The seed asks for it by class, not through the token: whatever the API is
    // configured to use, seeding must invent a year of history, never buy it.
    SimulatedRankProvider,
  ],
})
export class PagesModule {}
