import { Module } from '@nestjs/common';
import { LegsController } from './legs.controller';
import { LegsService } from './legs.service';

@Module({
  controllers: [LegsController],
  providers: [LegsService],
})
export class LegsModule {}
