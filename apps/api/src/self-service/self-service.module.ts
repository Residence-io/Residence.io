import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ResidentStorageModule } from '../resident-storage/resident-storage.module';
import { FinanceModule } from '../finance/finance.module';
import { ResidentDocumentsService } from './resident-documents.service';
import { ResidentRequestsService } from './resident-requests.service';
import { MoveInOutService } from './move-in-out.service';
import { CommunityService } from './community.service';
import { ResidentSelfServiceController } from './resident-self-service.controller';
import { AdminSelfServiceController } from './admin-self-service.controller';

@Module({
  imports: [PrismaModule, AuditModule, ResidentStorageModule, FinanceModule],
  controllers: [ResidentSelfServiceController, AdminSelfServiceController],
  providers: [
    ResidentDocumentsService,
    ResidentRequestsService,
    MoveInOutService,
    CommunityService,
  ],
  exports: [
    ResidentDocumentsService,
    ResidentRequestsService,
    MoveInOutService,
    CommunityService,
  ],
})
export class SelfServiceModule {}
