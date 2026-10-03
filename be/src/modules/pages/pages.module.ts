import { Module } from '@nestjs/common';
import { ClientsModule } from '@modules/clients/clients.module';
import { PagesController } from './controllers/pages/pages.controller';
import { KeywordsRepository } from './repositories/keywords/keywords.repository';
import { PageKeywordsRepository } from './repositories/page-keywords/page-keywords.repository';
import { PageListRepository } from './repositories/page-list/page-list.repository';
import { PagesRepository } from './repositories/pages/pages.repository';
import { RankSnapshotsRepository } from './repositories/rank-snapshots/rank-snapshots.repository';
import { SeoIssuesRepository } from './repositories/seo-issues/seo-issues.repository';
import { CrawlResultsService } from './services/crawl-results/crawl-results.service';
import { PageReadService } from './services/page-read/page-read.service';
import { SnapshotWriterService } from './services/snapshot-writer/snapshot-writer.service';

/** Owns pages, keywords, page_keywords, seo_issues and rank_snapshots. */
@Module({
  imports: [ClientsModule],
  controllers: [PagesController],
  providers: [
    PagesRepository,
    PageListRepository,
    KeywordsRepository,
    PageKeywordsRepository,
    SeoIssuesRepository,
    RankSnapshotsRepository,
    CrawlResultsService,
    SnapshotWriterService,
    PageReadService,
  ],
  exports: [CrawlResultsService, SnapshotWriterService],
})
export class PagesModule {}
