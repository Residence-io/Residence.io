import { Module } from '@nestjs/common';
import { ResidentDocumentsController } from './resident-documents.controller';
import { ResidentDocumentsService } from './resident-documents.service';
import { PrivateStorageService } from './private-storage.service';

@Module({
  controllers: [ResidentDocumentsController],
  providers: [PrivateStorageService, ResidentDocumentsService],
  exports: [PrivateStorageService],
})
export class ResidentStorageModule {}
