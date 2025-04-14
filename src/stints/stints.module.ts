import { Module } from '@nestjs/common';
import { StintsController } from './stints.controller';
import { StintsService } from './stints.service';

@Module({
  controllers: [StintsController],
  providers: [StintsService]
})
export class StintsModule {}
