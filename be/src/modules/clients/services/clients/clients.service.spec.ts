import type { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type { ClientsRepository } from '../../repositories/clients/clients.repository';
import type { CrawlRunItemsRepository } from '../../repositories/crawl-run-items/crawl-run-items.repository';
import type { CrawlRunsRepository } from '../../repositories/crawl-runs/crawl-runs.repository';
import { ClientsService } from './clients.service';

const scope = { userId: 1, timeZone: 'UTC' } as IUserScope;
const TX = { tx: true };

const uniqueViolation = (constraint: string) =>
  Object.assign(new Error('duplicate key'), {
    cause: { code: '23505', constraint },
  });

const makeService = () => {
  const clients = {
    insert: jest.fn().mockResolvedValue({
      id: 10,
      name: 'Yoast',
      websiteUrl: 'https://yoast.com',
      siteKey: 'yoast.com',
      createdAt: new Date(),
    }),
    findOwned: jest.fn(),
  };
  const runs = {
    insertQueued: jest.fn().mockResolvedValue({
      id: 20,
      clientId: 10,
      status: 'queued',
      trigger: 'user',
      sitemapUrl: null,
      selectionReason: null,
      pagesFound: 0,
      pagesDone: 0,
      errorCode: null,
      errorMessage: null,
      attempts: 0,
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
    }),
    notifyQueued: jest.fn(),
    summariesForClients: jest.fn().mockResolvedValue(new Map()),
  };
  const transactions = {
    run: jest.fn((work: (tx: unknown) => Promise<unknown>) => work(TX)),
  };
  const service = new ClientsService(
    clients as unknown as ClientsRepository,
    runs as unknown as CrawlRunsRepository,
    {} as CrawlRunItemsRepository,
    transactions as unknown as TransactionRunner,
  );
  return { service, clients, runs, transactions };
};

describe('ClientsService', () => {
  it('creates the client and its first queued run in one transaction', async () => {
    const { service, clients, runs, transactions } = makeService();

    await service.addClient(scope, {
      name: ' Yoast ',
      websiteUrl: 'yoast.com',
    });

    expect(transactions.run).toHaveBeenCalledTimes(1);
    expect(clients.insert).toHaveBeenCalledWith(TX, {
      userId: 1,
      name: 'Yoast',
      websiteUrl: 'https://yoast.com',
      siteKey: 'yoast.com',
    });
    expect(runs.insertQueued).toHaveBeenCalledWith(TX, 10, 'user');
    expect(runs.notifyQueued).toHaveBeenCalledWith(TX, 20);
  });

  it('refuses an invalid URL before touching the database', async () => {
    const { service, transactions } = makeService();

    await expect(
      service.addClient(scope, { name: 'x', websiteUrl: 'ftp://a.com' }),
    ).rejects.toMatchObject({ response: { errorCode: 'INVALID_WEBSITE_URL' } });
    expect(transactions.run).not.toHaveBeenCalled();
  });

  it('maps 23505 on the site-key index to CLIENT_ALREADY_EXISTS', async () => {
    const { service, clients } = makeService();
    clients.insert.mockRejectedValue(
      uniqueViolation('clients_user_id_site_key_uq'),
    );

    await expect(
      service.addClient(scope, { name: 'Yoast', websiteUrl: 'yoast.com' }),
    ).rejects.toMatchObject({
      response: { errorCode: 'CLIENT_ALREADY_EXISTS' },
    });
  });

  it('maps 23505 on the active-run index to CRAWL_ALREADY_ACTIVE', async () => {
    const { service, clients, runs } = makeService();
    clients.findOwned.mockResolvedValue({ id: 10 });
    runs.insertQueued.mockRejectedValue(
      uniqueViolation('crawl_runs_client_id_active_uq'),
    );

    await expect(service.requestRecrawl(scope, 10)).rejects.toMatchObject({
      response: { errorCode: 'CRAWL_ALREADY_ACTIVE' },
    });
  });

  it('answers CLIENT_NOT_FOUND for a re-crawl of a client the user does not own', async () => {
    const { service, clients } = makeService();
    clients.findOwned.mockResolvedValue(null);

    await expect(service.requestRecrawl(scope, 99)).rejects.toMatchObject({
      response: { errorCode: 'CLIENT_NOT_FOUND' },
    });
  });
});
