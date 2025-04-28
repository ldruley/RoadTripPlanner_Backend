import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Stint } from './entities/stint.entity';
import { Stop } from './entities/stop.entity';
import { Leg } from './entities/leg.entity';

// Services
import { StintsService } from './services/stints.service';
import { StopsService } from './services/stops.service';
import { LegsService } from './services/legs.service';
import { ItineraryService } from './services/itinerary.service';

// Controllers
import { StintsController } from './controllers/stints.controller';
import { StopsController } from './controllers/stops.controller';
import { LegsController } from './controllers/legs.controller';
import { ItineraryController } from './controllers/itinerary.controller';

// Import TripsModule with forwardRef to resolve circular dependency
import { TripsModule } from '../trips/trips.module';
import { LocationsService } from '../locations/locations.service';
import { LocationsModule } from '../locations/locations.module';
import { StintParticipant } from './entities/stint-participant.entity';
import { StintParticipantService } from './services/stint-participant.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stint, Stop, Leg, StintParticipant]),
    forwardRef(() => TripsModule),
    LocationsModule,
    UsersModule,
  ],
  controllers: [
    StintsController,
    StopsController,
    LegsController,
    ItineraryController,
  ],
  providers: [
    // Services
    StintsService,
    StintParticipantService,
    StopsService,
    LegsService,
    ItineraryService,
  ],
  exports: [
    // Export services for use in other modules
    StintsService,
    StintParticipantService,
    StopsService,
    LegsService,
    ItineraryService,
  ],
})
export class ItineraryModule {}
