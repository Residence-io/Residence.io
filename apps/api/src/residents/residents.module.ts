import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResidentStorageModule } from '../resident-storage/resident-storage.module';
import { IdentityProtectionService } from './identity-protection.service';
import { ResidentIdService } from './resident-id.service';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';

@Module({
  imports: [AuthModule, ResidentStorageModule],
  controllers: [ResidentsController],
  providers: [ResidentsService, IdentityProtectionService, ResidentIdService],
  exports: [ResidentsService, IdentityProtectionService],
})
export class ResidentsModule {}
