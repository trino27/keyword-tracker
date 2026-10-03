import { Transform } from 'class-transformer';
import { IsString, Length, MaxLength } from 'class-validator';
import type { ICreateClientRequest } from '@app/contracts';

/**
 * Shape only. Whether the address is a valid public website is decided by
 * `parseWebsiteUrl` in the service — one rule, shared with the frontend.
 */
export class CreateClientDto implements ICreateClientRequest {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 120)
  name: string;

  @IsString()
  @MaxLength(2048)
  websiteUrl: string;
}
