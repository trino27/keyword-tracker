import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { IClient, ICrawlRunSummary } from '@app/contracts';
import { CurrentScope } from '@core/decorators/current-scope/current-scope.decorator';
import { ParseIdPipe } from '@core/pipes/parse-id/parse-id.pipe';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { CreateClientDto } from '../../dto/create-client/create-client.dto';
import { UserThrottlerGuard } from '@core/guards/user-throttler/user-throttler.guard';
import { ClientsService } from '../../services/clients/clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  async list(@CurrentScope() scope: IUserScope): Promise<{ items: IClient[] }> {
    return { items: await this.clients.listClients(scope) };
  }

  @UseGuards(UserThrottlerGuard)
  @Post()
  async add(
    @CurrentScope() scope: IUserScope,
    @Body() body: CreateClientDto,
  ): Promise<{ client: IClient }> {
    return { client: await this.clients.addClient(scope, body) };
  }

  @Get(':id')
  async get(
    @CurrentScope() scope: IUserScope,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<{ client: IClient }> {
    return { client: await this.clients.getClient(scope, id) };
  }

  @UseGuards(UserThrottlerGuard)
  @Post(':id/crawl-runs')
  async recrawl(
    @CurrentScope() scope: IUserScope,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<{ run: ICrawlRunSummary }> {
    return { run: await this.clients.requestRecrawl(scope, id) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentScope() scope: IUserScope,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<void> {
    await this.clients.deleteClient(scope, id);
  }
}
