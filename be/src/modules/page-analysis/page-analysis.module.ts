import { Module } from '@nestjs/common';
import { PageAnalysisService } from './services/page-analysis/page-analysis.service';

/** Pure analysis behind one injectable; owns no table and does no I/O. */
@Module({
  providers: [PageAnalysisService],
  exports: [PageAnalysisService],
})
export class PageAnalysisModule {}
