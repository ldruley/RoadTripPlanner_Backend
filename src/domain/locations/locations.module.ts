import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationType } from './entities/location-type.entity';
import { HereApiModule } from '../../infrastructure/api/here-api/here-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, LocationType]),
    forwardRef(() => HereApiModule),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
