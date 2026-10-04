import type { DatabaseProbeRepository } from '../../repositories/database-probe/database-probe.repository';
import { HealthCheckService } from './health-check.service';

const makeService = (isReachable: boolean) =>
  new HealthCheckService({
    isReachable: jest.fn().mockResolvedValue(isReachable),
  } as unknown as DatabaseProbeRepository);

describe('HealthCheckService', () => {
  it('reports ok when the database answers', async () => {
    await expect(makeService(true).check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('reports degraded, not an error, when the database does not', async () => {
    await expect(makeService(false).check()).resolves.toEqual({
      status: 'degraded',
      database: 'down',
    });
  });
});
