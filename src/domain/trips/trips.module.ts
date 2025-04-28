import { forwardRef, Module } from '@nestjs/common';
import { TripsController } from './controllers/trips.controller';
import { TripsService } from './services/trips.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { ItineraryModule } from '../itinerary/itinerary.module';
import { TripParticipantsController } from './controllers/trip-participant.controller';
import { TripParticipantService } from './services/trip-participant.service';
import { TripParticipant } from './entities/trip-participant.entity';
import { UsersModule } from '../users/users.module';
import { TripSupply } from './entities/trip.supplies.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripParticipant, TripSupply]),
    forwardRef(() => ItineraryModule),
    UsersModule,
  ],
  controllers: [TripsController, TripParticipantsController],
  providers: [TripsService, TripParticipantService],
  exports: [TripsService, TripParticipantService],
})
export class TripsModule {}
