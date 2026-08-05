import { Module } from '@nestjs/common';
import { ResidentStorageModule } from '../resident-storage/resident-storage.module';
import { ResidentIDCardsController } from './resident-id-cards.controller';
import { ResidentIDCardsService } from './resident-id-cards.service';

@Module({
  imports: [ResidentStorageModule],
  controllers: [ResidentIDCardsController],
  providers: [ResidentIDCardsService],
})
export class ResidentIDCardsModule {}
