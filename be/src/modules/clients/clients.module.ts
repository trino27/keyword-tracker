import { Module } from '@nestjs/common';
import { ClientsController } from './controllers/clients/clients.controller';
import { CrawlRunsController } from './controllers/crawl-runs/crawl-runs.controller';
import { ClientsRepository } from './repositories/clients/clients.repository';
import { CrawlRunItemsRepository } from './repositories/crawl-run-items/crawl-run-items.repository';
import { CrawlRunsRepository } from './repositories/crawl-runs/crawl-runs.repository';
import { ClientCrawlRunsService } from './services/client-crawl-runs/client-crawl-runs.service';
import { ClientsService } from './services/clients/clients.service';

@Module({
  controllers: [ClientsController, CrawlRunsController],
  providers: [
    ClientsService,
    ClientCrawlRunsService,
    ClientsRepository,
    CrawlRunsRepository,
    CrawlRunItemsRepository,
  ],
  exports: [ClientsService, ClientCrawlRunsService],
})
export class ClientsModule {}
