import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type {
  IPageDetail,
  IPageListResponse,
  IPositionHistory,
} from '@app/contracts';
import { CurrentScope } from '@core/decorators/current-scope/current-scope.decorator';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { ListPagesQueryDto } from '../../dto/list-pages-query/list-pages-query.dto';
import { PositionsQueryDto } from '../../dto/positions-query/positions-query.dto';
import { PageReadService } from '../../services/page-read/page-read.service';
import { PositionHistoryService } from '../../services/position-history/position-history.service';

@Controller('pages')
export class PagesController {
  constructor(
    private readonly pages: PageReadService,
    private readonly history: PositionHistoryService,
  ) {}

  @Get()
  list(
    @CurrentScope() scope: IUserScope,
    @Query() query: ListPagesQueryDto,
  ): Promise<IPageListResponse> {
    return this.pages.listPages(scope, query);
  }

  @Get(':id')
  get(
    @CurrentScope() scope: IUserScope,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IPageDetail> {
    return this.pages.getPage(scope, id);
  }

  @Get(':id/positions')
  positions(
    @CurrentScope() scope: IUserScope,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PositionsQueryDto,
  ): Promise<IPositionHistory> {
    return this.history.getHistory(scope, id, query);
  }
}
