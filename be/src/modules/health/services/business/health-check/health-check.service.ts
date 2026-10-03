import { Injectable } from '@nestjs/common';
import type { IHealthResponse } from '@app/contracts';
import { DatabaseProbeRepository } from '../../../repositories/database-probe/database-probe.repository';

@Injectable()
export class HealthCheckService {
  constructor(private readonly databaseProbe: DatabaseProbeRepository) {}

  async check(): Promise<IHealthResponse> {
    const isDatabaseUp = await this.databaseProbe.isReachable();
    return {
      status: isDatabaseUp ? 'ok' : 'degraded',
      database: isDatabaseUp ? 'up' : 'down',
    };
  }
}
