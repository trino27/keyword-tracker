import { Module } from '@nestjs/common';
import { ClientsController } from './controllers/clients/clients.controller';
import { CrawlRunsController } from './controllers/crawl-runs/crawl-runs.controller';
import { ClientsRepository } from './repositories/clients/clients.repository';
import { CrawlRunItemsRepository } from './repositories/crawl-run-items/crawl-run-items.repository';
import { SiteChecksRepository } from './repositories/site-checks/site-checks.repository';
import { CrawlRunsRepository } from './repositories/crawl-runs/crawl-runs.repository';
import { ClientCrawlRunsService } from './services/client-crawl-runs/client-crawl-runs.service';
import { ClientsService } from './services/clients/clients.service';

/**
 * Owns clients, and the crawl QUEUE those clients are crawled through — crawl_runs
 * and crawl_run_items, with the `/crawl-runs` routes that read them.
 *
 * The queue looks like it belongs to the crawl module, and the reason it does not is
 * the dependency direction. Creating a client enqueues its first run in the same
 * transaction as the client row, so whoever owns `clients` needs the queue; and the
 * crawl module needs the client's site to execute a run. Were the queue in `crawl`,
 * those two needs would point at each other and the graph would need a `forwardRef`,
 * which this codebase does not allow. Putting the rows here leaves `crawl` a pure
 * executor that owns no table, and the graph acyclic: clients depends on nothing,
 * pages and crawl depend on clients, and nothing depends on crawl.
 *
 * The cost is this module holding two aggregates and two route prefixes. It is the
 * cheaper of the two prices, and the alternative — the caller starting the crawl
 * after `create` returns — gives up the transaction that makes a client without a
 * queued run impossible.
 */
@Module({
  controllers: [ClientsController, CrawlRunsController],
  providers: [
    ClientsService,
    ClientCrawlRunsService,
    ClientsRepository,
    CrawlRunsRepository,
    CrawlRunItemsRepository,
    SiteChecksRepository,
  ],
  exports: [ClientsService, ClientCrawlRunsService],
})
export class ClientsModule {}
