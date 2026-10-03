import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health/health.controller';
import { DatabaseProbeRepository } from './repositories/database-probe/database-probe.repository';
import { HealthCheckService } from './services/business/health-check/health-check.service';

@Module({
  controllers: [HealthController],
  providers: [HealthCheckService, DatabaseProbeRepository],
})
export class HealthModule {}
