import { Controller, Get, Param } from '@nestjs/common';
import type { IClientIssueReport } from '@app/contracts';
import { CurrentScope } from '@core/decorators/current-scope/current-scope.decorator';
import { ParseIdPipe } from '@core/pipes/parse-id/parse-id.pipe';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { IssueReportService } from '../../services/issue-report/issue-report.service';

/** `GET /api/clients/:id/issues` — every finding on the client's current crawl. */
@Controller('clients')
export class IssueReportController {
  constructor(private readonly reports: IssueReportService) {}

  @Get(':id/issues')
  report(
    @CurrentScope() scope: IUserScope,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<IClientIssueReport> {
    return this.reports.reportFor(scope, id);
  }
}
