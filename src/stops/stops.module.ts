import { Module } from '@nestjs/common';
import { StopsController } from './stops.controller';
import { StopsService } from './stops.service';

@Module({
  controllers: [StopsController],
  providers: [StopsService],
})
export class StopsModule {}
