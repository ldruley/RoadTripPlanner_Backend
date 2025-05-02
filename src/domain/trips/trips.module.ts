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
import { TripSuppliesController } from './controllers/trip-supplies.controller';
import { TripSuppliesService } from './services/trip-supplies.service';
import { SuppliesModule } from '../supplies/supplies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripParticipant, TripSupply]),
    forwardRef(() => ItineraryModule),
    UsersModule,
    SuppliesModule,
  ],
  controllers: [
    TripsController,
    TripParticipantsController,
    TripSuppliesController,
  ],
  providers: [TripsService, TripParticipantService, TripSuppliesService],
  exports: [TripsService, TripParticipantService, TripSuppliesService],
})
export class TripsModule {}
