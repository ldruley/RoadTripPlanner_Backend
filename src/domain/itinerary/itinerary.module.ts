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

// Import TripsModule with forwardRef to resolve circular dependency
import { TripsModule } from '../trips/trips.module';
import { LocationsModule } from '../locations/locations.module';
import { StintVehicle } from './entities/stint-vehicle.entity';
import { StintVehicleController } from './controllers/stint-vehicle.controller';
import { StintVehicleService } from './services/stint-vehicle.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { UsersModule } from '../users/users.module';
import { HereApiService } from '../../infrastructure/api/here-api/here-api.service';
import { HereApiModule } from '../../infrastructure/api/here-api/here-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stint, Stop, Leg, StintVehicle]),
    forwardRef(() => TripsModule),
    LocationsModule,
    VehiclesModule,
    UsersModule,
    HereApiModule,
  ],
  controllers: [StintsController, StopsController, StintVehicleController],
  providers: [
    // Services
    StintsService,
    StopsService,
    LegsService,
    ItineraryService,
    StintVehicleService,
  ],
  exports: [
    // Export services for use in other modules
    StintsService,
    StopsService,
    LegsService,
    ItineraryService,
    StintVehicleService,
  ],
})
export class ItineraryModule {}
