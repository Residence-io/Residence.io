import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VisitorPassService } from './visitor-pass.service';
import { ResidentsVisitorsController } from './residents-visitors.controller';
import { GuardVisitorsController } from './guard-visitors.controller';
import { AdminVisitorsController } from './admin-visitors.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    ResidentsVisitorsController,
    GuardVisitorsController,
    AdminVisitorsController,
  ],
  providers: [VisitorPassService],
  exports: [VisitorPassService],
})
export class VisitorsModule {}
