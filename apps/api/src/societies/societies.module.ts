import { Module } from '@nestjs/common';
import { SocietiesController } from './societies.controller';

@Module({ controllers: [SocietiesController] })
export class SocietiesModule {}
