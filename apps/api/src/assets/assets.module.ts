import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AdminAssetsController } from './admin-assets.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AdminAssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
