import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SEARCH_LENGTH,
  MAX_PAGE_SIZE,
} from '@app/contracts';
import { MAX_ID } from '@core/constants/id.constant';

/** `?q=` and `?q=   ` mean "no search", not a 400. */
const trimToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class ListPagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ID)
  clientId?: number;

  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(MAX_PAGE_SEARCH_LENGTH)
  q?: string;

  // Bounded like an id: an offset past the column's range is a malformed request,
  // not a 500 from Postgres.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ID)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;
}
