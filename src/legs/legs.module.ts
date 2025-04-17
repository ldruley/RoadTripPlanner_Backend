import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegsController } from './legs.controller';
import { LegsService } from './legs.service';
import { Leg } from './entities/leg.entity';
import { LegsRepository } from './repository/legs.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Leg])],
  controllers: [LegsController],
  providers: [LegsService, LegsRepository],
  exports: [LegsService, LegsRepository]
})
export class LegsModule {}