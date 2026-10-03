import { Injectable } from '@nestjs/common';
import {
  parseWebsiteUrl,
  type IClient,
  type ICrawlRunDetail,
  type ICrawlRunSummary,
  type ICreateClientRequest,
} from '@app/contracts';
import { uniqueViolationConstraint } from '@persistence/errors/unique-violation.util';
import { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import {
  ClientAlreadyExistsException,
  ClientNotFoundException,
  CrawlAlreadyActiveException,
  CrawlRunNotFoundException,
  InvalidWebsiteUrlException,
} from '../../exceptions/clients.exceptions';
import { toClient, toCrawlRunSummary } from '../../mappers/client.mapper';
import { ClientsRepository } from '../../repositories/clients/clients.repository';
import { CrawlRunItemsRepository } from '../../repositories/crawl-run-items/crawl-run-items.repository';
import { CrawlRunsRepository } from '../../repositories/crawl-runs/crawl-runs.repository';

const CLIENT_SITE_KEY_INDEX = 'clients_user_id_site_key_uq';
const ACTIVE_RUN_INDEX = 'crawl_runs_client_id_active_uq';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clients: ClientsRepository,
    private readonly runs: CrawlRunsRepository,
    private readonly items: CrawlRunItemsRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  async listClients(scope: IUserScope): Promise<IClient[]> {
    const owned = await this.clients.listOwned(scope);
    const summaries = await this.runs.summariesForClients(
      owned.map((client) => client.id),
    );
    return owned.map((client) => toClient(client, summaries.get(client.id)!));
  }

  /** For other modules filtering by a client: 404 unless the scope's user owns it. */
  async assertOwnedClient(scope: IUserScope, clientId: number): Promise<void> {
    const client = await this.clients.findOwned(scope, clientId);
    if (!client) throw new ClientNotFoundException({ clientId });
  }

  async getClient(scope: IUserScope, clientId: number): Promise<IClient> {
    const client = await this.clients.findOwned(scope, clientId);
    if (!client) throw new ClientNotFoundException({ clientId });
    const summaries = await this.runs.summariesForClients([client.id]);
    return toClient(client, summaries.get(client.id)!);
  }

  /**
   * The client and its first queued run are created in ONE transaction, and the
   * request returns at once — the crawl worker picks the run up. Uniqueness is the
   * index's job: two concurrent adds of one site race to the insert, and the loser's
   * 23505 becomes a 409 instead of a 500.
   */
  async addClient(
    scope: IUserScope,
    request: ICreateClientRequest,
  ): Promise<IClient> {
    const website = parseWebsiteUrl(request.websiteUrl);
    if (!website.ok) {
      throw new InvalidWebsiteUrlException({ reason: website.reason });
    }

    try {
      return await this.transactions.run(async (tx) => {
        const client = await this.clients.insert(tx, {
          userId: scope.userId,
          name: request.name.trim(),
          websiteUrl: website.origin,
          siteKey: website.siteKey,
        });
        const run = await this.runs.insertQueued(tx, client.id, 'user');
        await this.runs.notifyQueued(tx, run.id);
        return toClient(client, { latest: run, currentPageCount: 0 });
      });
    } catch (error: unknown) {
      if (uniqueViolationConstraint(error) === CLIENT_SITE_KEY_INDEX) {
        throw new ClientAlreadyExistsException({ siteKey: website.siteKey });
      }
      throw error;
    }
  }

  /**
   * A crawl in flight is not waited for: its finalize finds the run gone, its fence
   * fails, and it writes nothing.
   */
  async deleteClient(scope: IUserScope, clientId: number): Promise<void> {
    if (!(await this.clients.deleteOwned(scope, clientId))) {
      throw new ClientNotFoundException({ clientId });
    }
  }

  async requestRecrawl(
    scope: IUserScope,
    clientId: number,
  ): Promise<ICrawlRunSummary> {
    const client = await this.clients.findOwned(scope, clientId);
    if (!client) throw new ClientNotFoundException({ clientId });

    try {
      return await this.transactions.run(async (tx) => {
        const run = await this.runs.insertQueued(tx, client.id, 'user');
        await this.runs.notifyQueued(tx, run.id);
        return toCrawlRunSummary(run);
      });
    } catch (error: unknown) {
      if (uniqueViolationConstraint(error) === ACTIVE_RUN_INDEX) {
        throw new CrawlAlreadyActiveException({ clientId });
      }
      throw error;
    }
  }

  async getRunDetail(
    scope: IUserScope,
    runId: number,
  ): Promise<ICrawlRunDetail> {
    const run = await this.runs.findOwned(scope, runId);
    if (!run) throw new CrawlRunNotFoundException({ runId });
    const items = await this.items.listByRun(run.id);
    return {
      ...toCrawlRunSummary(run),
      clientId: run.clientId,
      sitemapUrl: run.sitemapUrl,
      selectionReason: run.selectionReason,
      items,
    };
  }
}
