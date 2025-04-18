import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StintsController } from './stints.controller';
import { StintsService } from './stints.service';
import { Stint } from './entities/stint.entity';
import { StintsRepository } from './repository/stints.repository';
import { StopsModule } from '../stops/stops.module';
import { TripsModule } from '../trips/trips.module';


//TODO evaluate circular dependencies
@Module({
  imports: [
    TypeOrmModule.forFeature([Stint]),
    forwardRef(() => StopsModule),
    forwardRef(() => TripsModule)
  ],
  controllers: [StintsController],
  providers: [StintsService, StintsRepository],
  exports: [StintsService, StintsRepository]
})
export class StintsModule {}