import { Module } from '@nestjs/common';
import { RemoteApiModule } from '@infrastructure/remote-api/remote-api.module';
import { PgNotificationListener } from '@persistence/connections/postgres/notification-listener/pg-notification-listener';
import { ClientsModule } from '@modules/clients/clients.module';
import { PageAnalysisModule } from '@modules/page-analysis/page-analysis.module';
import { PagesModule } from '@modules/pages/pages.module';
import { CRAWL_RUN_EXECUTOR } from './ports/crawl-run-executor.port';
import { CrawlRunExecutorService } from './services/crawl-run-executor/crawl-run-executor.service';
import { FeedDiscoveryService } from './services/feed-discovery/feed-discovery.service';
import { PostSelectionService } from './services/post-selection/post-selection.service';
import { SiteHttpClient } from './services/site-http-client/site-http-client';
import { SitemapDiscoveryService } from './services/sitemap-discovery/sitemap-discovery.service';
import { CrawlWorker } from './workers/crawl-worker/crawl-worker';

/**
 * Executes crawl runs; owns no table. The clients module owns the queue rows, the
 * pages module what a run finds. The worker starts only with CRAWL_WORKER_ENABLED=true.
 */
@Module({
  imports: [RemoteApiModule, ClientsModule, PagesModule, PageAnalysisModule],
  providers: [
    CrawlWorker,
    PgNotificationListener,
    SiteHttpClient,
    FeedDiscoveryService,
    SitemapDiscoveryService,
    PostSelectionService,
    CrawlRunExecutorService,
    { provide: CRAWL_RUN_EXECUTOR, useExisting: CrawlRunExecutorService },
  ],
  exports: [CrawlWorker],
})
export class CrawlModule {}
