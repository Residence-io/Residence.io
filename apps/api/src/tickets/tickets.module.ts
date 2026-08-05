import { Module } from '@nestjs/common';
import { ResidentStorageModule } from '../resident-storage/resident-storage.module';
import { WorkforceModule } from '../workforce/workforce.module';
import { TicketIdService } from './ticket-id.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [ResidentStorageModule, WorkforceModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketIdService],
  exports: [TicketsService],
})
export class TicketsModule {}
