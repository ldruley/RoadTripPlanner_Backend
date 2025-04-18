import { forwardRef, Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { TripsRepository } from './repository/trips.repository';
import { ItineraryModule } from '../itinerary/itinerary.module';

//TODO evaluate circular dependencies
@Module({
  imports: [
    TypeOrmModule.forFeature([Trip]),
    forwardRef(() => ItineraryModule),
  ],
  controllers: [TripsController],
  providers: [TripsService, TripsRepository],
  exports: [TripsService, TripsRepository],
})
export class TripsModule {}
