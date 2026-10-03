import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import type { ICrawlRunDetail } from '@app/contracts';
import { CurrentScope } from '@core/decorators/current-scope/current-scope.decorator';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { ClientsService } from '../../services/clients/clients.service';

@Controller('crawl-runs')
export class CrawlRunsController {
  constructor(private readonly clients: ClientsService) {}

  @Get(':id')
  async get(
    @CurrentScope() scope: IUserScope,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ run: ICrawlRunDetail }> {
    return { run: await this.clients.getRunDetail(scope, id) };
  }
}
