import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Stint } from './entities/stint.entity';
import { Stop } from './entities/stop.entity';
import { Leg } from './entities/leg.entity';

// Repositories
import { StintsRepository } from './repositories/stints.repository';
import { StopsRepository } from './repositories/stops.repository';
import { LegsRepository } from './repositories/legs.repository';

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

@Module({
  imports: [
    TypeOrmModule.forFeature([Stint, Stop, Leg]),
    forwardRef(() => TripsModule), // resolve circular dependency
  ],
  controllers: [
    StintsController,
    StopsController,
    LegsController,
    ItineraryController,
  ],
  providers: [
    // Repositories
    StintsRepository,
    StopsRepository,
    LegsRepository,

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
