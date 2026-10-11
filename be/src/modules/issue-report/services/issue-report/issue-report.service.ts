import { Injectable } from '@nestjs/common';
import type { IClientIssueReport, TReportIssue } from '@app/contracts';
import { PageSpeedAvailabilityService } from '@infrastructure/config/page-speed-settings/page-speed-availability/page-speed-availability.service';
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
    private readonly pageSpeed: PageSpeedAvailabilityService,
  ) {}

  async reportFor(
    scope: IUserScope,
    clientId: number,
  ): Promise<IClientIssueReport> {
    const client = await this.clients.getClient(scope, clientId);
    const pageSpeedAvailability = this.pageSpeed.current();
    // One read-only, repeatable-read snapshot: a crawl finishing mid-read cannot pair one
    // run's site checks with another run's pages.
    const { run, pageFindings, siteFindings } = await this.reports.snapshot(
      scope,
      clientId,
    );
    if (!run)
      return {
        client: { id: client.id, name: client.name },
        generatedFrom: null,
        pageSpeedAvailability,
        currentPages: 0,
        issues: [],
      };

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
