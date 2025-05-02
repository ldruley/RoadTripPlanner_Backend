import { forwardRef, Module } from '@nestjs/common';
import { HereApiService } from './here-api.service';
import { HereLocationController } from './location-controller';
import { ConfigModule } from '@nestjs/config';
import { RoutingController } from './routing-controller';
import { ItineraryModule } from '../../../domain/itinerary/itinerary.module';

@Module({
  imports: [ConfigModule, forwardRef(() => ItineraryModule)],
  controllers: [HereLocationController, RoutingController],
  providers: [HereApiService],
  exports: [HereApiService],
})
export class HereApiModule {}
