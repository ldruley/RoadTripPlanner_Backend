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

@Module({
  imports: [
    TypeOrmModule.forFeature([Stint, Stop, Leg]),
    forwardRef(() => TripsModule),
    LocationsModule,
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
    StopsService,
    LegsService,
    ItineraryService,
  ],
  exports: [
    // Export services for use in other modules
    StintsService,
    StopsService,
    LegsService,
    ItineraryService,
  ],
})
export class ItineraryModule {}
