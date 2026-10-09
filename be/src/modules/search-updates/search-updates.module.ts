import { Module } from '@nestjs/common';
import { RemoteApiModule } from '@infrastructure/remote-api/remote-api.module';
import { SearchUpdatesController } from './controllers/search-updates/search-updates.controller';
import { SearchUpdatesService } from './services/search-updates/search-updates.service';

/**
 * Google's announced ranking updates, read from the Search Status Dashboard. Owns no
 * table: the list is Google's, the same for every user, and held in memory.
 */
@Module({
  imports: [RemoteApiModule],
  controllers: [SearchUpdatesController],
  providers: [SearchUpdatesService],
})
export class SearchUpdatesModule {}
