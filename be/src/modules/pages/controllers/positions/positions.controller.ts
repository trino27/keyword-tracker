import { Controller, Post, UseGuards } from '@nestjs/common';
import type { IPositionFillResult } from '@app/contracts';
import { CurrentScope } from '@core/decorators/current-scope/current-scope.decorator';
import { UserThrottlerGuard } from '@core/guards/user-throttler/user-throttler.guard';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { PositionFillService } from '../../services/position-fill/position-fill.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positions: PositionFillService) {}

  /**
   * Generates the missing daily positions for the signed-in user's pages — the seed's
   * fill, reachable from the UI so a client added through it gets a history without a
   * shell. Rate limited: one call can write tens of thousands of rows.
   */
  @UseGuards(UserThrottlerGuard)
  @Post('fill')
  fill(@CurrentScope() scope: IUserScope): Promise<IPositionFillResult> {
    return this.positions.fillForScope(scope);
  }
}
