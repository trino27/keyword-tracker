import type { PinoLogger } from 'nestjs-pino';
import type { RemoteApiCore } from '@infrastructure/remote-api/remote-api.core';
import { RemoteApiUnavailableError } from '@infrastructure/remote-api/remote-api.errors';
import { SEARCH_UPDATES_LIMITS } from '../../constants/search-status.constant';
import { SearchUpdatesService } from './search-updates.service';

const FEED = [
  {
    id: 'core-may',
    service_name: 'Ranking',
    external_desc: 'May 2026 core update',
    begin: '2026-05-21T00:00:00Z',
    end: '2026-06-02T00:00:00Z',
    uri: 'incidents/core-may',
  },
];

const answering = (...answers: unknown[]) => {
  const get = jest.fn(() => {
    const answer = answers.shift();
    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve({
          status: 200,
          body: Buffer.from(JSON.stringify(answer)),
        });
  });
  const logger = { warn: jest.fn() } as unknown as PinoLogger;
  return {
    get,
    service: new SearchUpdatesService(
      { get } as unknown as RemoteApiCore,
      logger,
    ),
  };
};

describe('SearchUpdatesService', () => {
  afterEach(() => jest.useRealTimers());

  it('reads the dashboard once and serves the list from memory after', async () => {
    const { get, service } = answering(FEED);

    const first = await service.list();
    const second = await service.list();

    expect(first).toEqual({
      available: true,
      updates: [expect.objectContaining({ id: 'core-may', kind: 'core' })],
    });
    expect(second).toEqual(first);
    expect(get).toHaveBeenCalledTimes(1);
  });

  // An empty list would read as "no update happened" — the one claim it cannot make.
  it('says the list is unavailable when the dashboard never answered', async () => {
    const { service } = answering(
      new RemoteApiUnavailableError('x', new Error()),
    );

    await expect(service.list()).resolves.toEqual({
      available: false,
      updates: [],
    });
  });

  it('keeps serving the last good list when a later read fails', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-09T00:00:00Z') });
    const { get, service } = answering(
      FEED,
      new RemoteApiUnavailableError('x', new Error()),
    );

    await service.list();
    jest.setSystemTime(Date.now() + SEARCH_UPDATES_LIMITS.freshForMs + 1);
    const later = await service.list();

    expect(get).toHaveBeenCalledTimes(2);
    expect(later).toMatchObject({
      available: true,
      updates: [{ id: 'core-may' }],
    });
  });

  it('waits before asking a failing dashboard again', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-09T00:00:00Z') });
    const { get, service } = answering(
      new RemoteApiUnavailableError('x', new Error()),
      FEED,
    );

    await service.list();
    await service.list();
    expect(get).toHaveBeenCalledTimes(1);

    jest.setSystemTime(
      Date.now() + SEARCH_UPDATES_LIMITS.retryAfterFailureMs + 1,
    );
    await expect(service.list()).resolves.toMatchObject({ available: true });
    expect(get).toHaveBeenCalledTimes(2);
  });
});
