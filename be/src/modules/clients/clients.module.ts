import { Module } from '@nestjs/common';
import { ClientsController } from './controllers/clients/clients.controller';
import { CrawlRunsController } from './controllers/crawl-runs/crawl-runs.controller';
import { ClientsRepository } from './repositories/clients/clients.repository';
import { CrawlRunItemsRepository } from './repositories/crawl-run-items/crawl-run-items.repository';
import { CrawlRunsRepository } from './repositories/crawl-runs/crawl-runs.repository';
import { ClientsService } from './services/clients/clients.service';

@Module({
  controllers: [ClientsController, CrawlRunsController],
  providers: [
    ClientsService,
    ClientsRepository,
    CrawlRunsRepository,
    CrawlRunItemsRepository,
  ],
  exports: [ClientsService],
})
export class ClientsModule {}
