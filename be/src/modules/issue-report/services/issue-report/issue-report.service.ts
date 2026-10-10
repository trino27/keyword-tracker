import { Inject, Injectable } from '@nestjs/common';
import type { IClientIssueReport, TReportIssue } from '@app/contracts';
import { pageSpeedAvailabilityOf } from '@infrastructure/config/page-speed-settings/page-speed-availability-of';
import { PageSpeedRuntimeState } from '@infrastructure/config/page-speed-settings/page-speed-runtime-state';
import {
  PAGE_SPEED_SETTINGS,
  type IPageSpeedSettings,
} from '@infrastructure/config/page-speed-settings/page-speed-settings';
import { ClientsService } from '@modules/clients/services/clients/clients.service';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { IssueReportRepository } from '../../repositories/issue-report/issue-report.repository';
import { collapseOriginFindings } from '../collapse-origin-findings/collapse-origin-findings';

/**
 * One client's findings as one snapshot of its current crawl (plan D17). A foreign or
 * missing client is the same 404 — `getClient` throws it before anything is read.
 */
@Injectable()
export class IssueReportService {
  constructor(
    private readonly reports: IssueReportRepository,
    private readonly clients: ClientsService,
    @Inject(PAGE_SPEED_SETTINGS)
    private readonly pageSpeedSettings: IPageSpeedSettings,
    private readonly pageSpeedRuntime: PageSpeedRuntimeState,
  ) {}

  async reportFor(
    scope: IUserScope,
    clientId: number,
  ): Promise<IClientIssueReport> {
    const client = await this.clients.getClient(scope, clientId);
    const pageSpeedAvailability = pageSpeedAvailabilityOf(
      this.pageSpeedSettings,
      this.pageSpeedRuntime,
    );
    const run = await this.reports.currentRun(scope, clientId);
    if (!run)
      return {
        client: { id: client.id, name: client.name },
        generatedFrom: null,
        pageSpeedAvailability,
        currentPages: 0,
        issues: [],
      };

    const [pageFindings, siteFindings] = await Promise.all([
      this.reports.pageFindings(scope, clientId, run.runId),
      this.reports.failedSiteChecks(scope, run.runId),
    ]);
    const issues: TReportIssue[] = [
      ...siteFindings.map((finding): TReportIssue => ({
        ...finding,
        location: { kind: 'site' },
      })),
      ...collapseOriginFindings(pageFindings),
    ];

    return {
      client: { id: client.id, name: client.name },
      generatedFrom: {
        runId: run.runId,
        finishedAt: run.finishedAt.toISOString(),
      },
      pageSpeedAvailability,
      currentPages: run.pages,
      issues,
    };
  }
}
