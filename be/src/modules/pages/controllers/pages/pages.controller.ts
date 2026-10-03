import { Controller, Get, Query } from '@nestjs/common';
import type { IPageListResponse } from '@app/contracts';
import { CurrentScope } from '@core/decorators/current-scope/current-scope.decorator';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { ListPagesQueryDto } from '../../dto/list-pages-query/list-pages-query.dto';
import { PageReadService } from '../../services/page-read/page-read.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PageReadService) {}

  @Get()
  list(
    @CurrentScope() scope: IUserScope,
    @Query() query: ListPagesQueryDto,
  ): Promise<IPageListResponse> {
    return this.pages.listPages(scope, query);
  }
}
