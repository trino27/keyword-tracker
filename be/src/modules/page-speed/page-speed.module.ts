import { Module } from '@nestjs/common';
import { RemoteApiModule } from '@infrastructure/remote-api/remote-api.module';
import { PgNotificationListener } from '@persistence/connections/postgres/notification-listener/pg-notification-listener';
import { PagesModule } from '@modules/pages/pages.module';
import { PageSpeedExecutorService } from './services/page-speed-executor/page-speed-executor.service';
import { PsiClient } from './services/psi-client/psi-client';
import { PageSpeedRateLimiter } from './services/rate-limiter/page-speed-rate-limiter';
import { PageSpeedWorker } from './workers/page-speed-worker/page-speed-worker';

/**
 * Measures queued pages with Google PageSpeed Insights; owns no table — the pages module
 * owns `page_speed` and the findings, this module only executes (plan D24).
 *
 * Imported by AppModule only: the seed process must never hold a worker it would exit
 * under mid-call. Its own PgNotificationListener, so it holds its own LISTEN connection
 * rather than overwriting the crawl worker's.
 */
@Module({
  imports: [RemoteApiModule, PagesModule],
  providers: [
    PsiClient,
    PageSpeedRateLimiter,
    PageSpeedExecutorService,
    PageSpeedWorker,
    PgNotificationListener,
  ],
  exports: [PageSpeedWorker],
})
export class PageSpeedModule {}
