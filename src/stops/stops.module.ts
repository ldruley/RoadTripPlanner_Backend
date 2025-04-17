import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StopsController } from './stops.controller';
import { StopsService } from './stops.service';
import { StopsRepository } from './repository/stops.repository';
import { Stop } from './entities/stop.entity';
import { TripsModule } from '../trips/trips.module';
import { StintsModule } from '../stints/stints.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stop]),
    TripsModule,
    StintsModule
  ],
  controllers: [StopsController],
  providers: [StopsService, StopsRepository],
  exports: [StopsService, StopsRepository]
})
export class StopsModule {}