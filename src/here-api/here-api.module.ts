import { Module } from '@nestjs/common';
import { HereApiService } from './here-api.service';
import { LocationController } from './location-controller';
import { ConfigModule } from '@nestjs/config';
import {RoutingController} from "./routing-controller";
import {StopsModule} from "../stops/stops.module";

@Module({
    imports: [
        ConfigModule,
        StopsModule]
    ,
    controllers: [LocationController, RoutingController],
    providers: [HereApiService],
    exports: [HereApiService]
})
export class HereApiModule {}