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

// Controllers
import { StintsController } from './controllers/stints.controller';
import { StopsController } from './controllers/stops.controller';
import { LegsController } from './controllers/legs.controller';

// Import TripsModule with forwardRef to resolve circular dependency
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stint, Stop, Leg]),
    forwardRef(() => TripsModule), // Add this line to resolve circular dependency
  ],
  controllers: [StintsController, StopsController, LegsController],
  providers: [
    // Repositories
    StintsRepository,
    StopsRepository,
    LegsRepository,

    // Services
    StintsService,
    StopsService,
    LegsService,
  ],
  exports: [
    // Export services for use in other modules
    StintsService,
    StopsService,
    LegsService,
  ],
})
export class ItineraryModule {}
