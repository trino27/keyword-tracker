import { IsOptional } from 'class-validator';
import type { IPositionsQuery, TIsoDay } from '@app/contracts';
import { IsIsoDay } from '@core/utils/validation/is-iso-day.decorator';

/**
 * Calendar days only. There is deliberately no `timeZone` field: the zone is the
 * user's, from the session, and the global pipe refuses any undeclared parameter.
 */
export class PositionsQueryDto implements IPositionsQuery {
  @IsOptional()
  @IsIsoDay()
  from?: TIsoDay;

  @IsOptional()
  @IsIsoDay()
  to?: TIsoDay;
}
