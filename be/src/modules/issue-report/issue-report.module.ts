import { Module } from '@nestjs/common';
import { ClientsModule } from '@modules/clients/clients.module';
import { IssueReportController } from './controllers/issue-report/issue-report.controller';
import { IssueReportRepository } from './repositories/issue-report/issue-report.repository';
import { IssueReportService } from './services/issue-report/issue-report.service';

/**
 * The issue report: a read model across pages, speed and site checks, so it owns no table
 * — giving it to the pages or the clients module would make that module's document
 * describe the other's tables.
 */
@Module({
  imports: [ClientsModule],
  controllers: [IssueReportController],
  providers: [IssueReportRepository, IssueReportService],
})
export class IssueReportModule {}
