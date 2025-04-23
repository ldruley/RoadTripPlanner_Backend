import { forwardRef, Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { ItineraryModule } from '../itinerary/itinerary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip]),
    forwardRef(() => ItineraryModule), // Use forwardRef for circular dependency
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
