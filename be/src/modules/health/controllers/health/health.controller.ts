import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { IHealthResponse } from '@app/contracts';
import { Public } from '@core/decorators/public/public.decorator';
import { HealthCheckService } from '../../services/business/health-check/health-check.service';

// Public: the container healthcheck and Caddy probe it without a session.
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheck: HealthCheckService) {}

  /**
   * 200 when everything answers, 503 when the database does not — so a container
   * healthcheck and a load balancer read the status code, and a person reads the body.
   */
  @Get()
  async get(
    @Res({ passthrough: true }) response: Response,
  ): Promise<IHealthResponse> {
    const health = await this.healthCheck.check();
    if (health.status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }
}
