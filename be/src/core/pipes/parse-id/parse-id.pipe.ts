import {
  BadRequestException,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import { MAX_ID } from '@core/constants/id.constant';

/**
 * `@Param('id', ParseIdPipe)` — what `ParseIntPipe` does, bounded.
 *
 * `ParseIntPipe` accepts `99999999999999999999`: `parseInt` yields 1e20, which is an
 * integer as far as JavaScript is concerned. Bound as a query parameter, Postgres then
 * refuses it as out of range and the error surfaces as a 500 for an id that is simply
 * malformed. A malformed id is a 400 here, like a non-numeric one; a well-formed id
 * that names no row the user owns stays a 404, decided by the query.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1 || id > MAX_ID) {
      throw new BadRequestException(
        `Validation failed (${metadata.data ?? 'id'} must be a positive integer)`,
      );
    }
    return id;
  }
}
