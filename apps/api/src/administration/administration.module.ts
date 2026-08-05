import { Module } from '@nestjs/common';
import {
  AdministrationController,
  ProfileController,
} from './administration.controller';
import { AdministrationService } from './administration.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [AdministrationController, ProfileController, ReportsController],
  providers: [AdministrationService, ReportsService],
})
export class AdministrationModule {}
