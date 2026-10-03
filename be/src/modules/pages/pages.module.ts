import { Module } from '@nestjs/common';
import { PagesRepository } from './repositories/pages/pages.repository';
import { CrawlResultsService } from './services/crawl-results/crawl-results.service';

@Module({
  providers: [PagesRepository, CrawlResultsService],
  exports: [CrawlResultsService],
})
export class PagesModule {}
