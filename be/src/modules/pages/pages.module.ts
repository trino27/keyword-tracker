import { Module } from '@nestjs/common';
import { KeywordsRepository } from './repositories/keywords/keywords.repository';
import { PageKeywordsRepository } from './repositories/page-keywords/page-keywords.repository';
import { PagesRepository } from './repositories/pages/pages.repository';
import { SeoIssuesRepository } from './repositories/seo-issues/seo-issues.repository';
import { CrawlResultsService } from './services/crawl-results/crawl-results.service';

@Module({
  providers: [
    PagesRepository,
    KeywordsRepository,
    PageKeywordsRepository,
    SeoIssuesRepository,
    CrawlResultsService,
  ],
  exports: [CrawlResultsService],
})
export class PagesModule {}
