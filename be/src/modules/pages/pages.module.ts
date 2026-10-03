import { Module } from '@nestjs/common';
import { KeywordsRepository } from './repositories/keywords/keywords.repository';
import { PageKeywordsRepository } from './repositories/page-keywords/page-keywords.repository';
import { PagesRepository } from './repositories/pages/pages.repository';
import { RankSnapshotsRepository } from './repositories/rank-snapshots/rank-snapshots.repository';
import { SeoIssuesRepository } from './repositories/seo-issues/seo-issues.repository';
import { CrawlResultsService } from './services/crawl-results/crawl-results.service';
import { SnapshotWriterService } from './services/snapshot-writer/snapshot-writer.service';

@Module({
  providers: [
    PagesRepository,
    KeywordsRepository,
    PageKeywordsRepository,
    SeoIssuesRepository,
    RankSnapshotsRepository,
    CrawlResultsService,
    SnapshotWriterService,
  ],
  exports: [CrawlResultsService, SnapshotWriterService],
})
export class PagesModule {}
