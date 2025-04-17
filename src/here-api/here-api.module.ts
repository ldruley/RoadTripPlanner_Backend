import { Module } from '@nestjs/common';
import { HereApiService } from './here-api.service';
import { LocationController } from './location-controller';
import { ConfigModule } from '@nestjs/config';
import {RoutingController} from "./routing-controller";

@Module({
    imports: [ConfigModule],
    controllers: [LocationController, RoutingController],
    providers: [HereApiService],
    exports: [HereApiService]
})
export class HereApiModule {}