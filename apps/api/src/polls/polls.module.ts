import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { AdminPollsController } from './admin-polls.controller';
import { ResidentPollsController } from './resident-polls.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AdminPollsController, ResidentPollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
