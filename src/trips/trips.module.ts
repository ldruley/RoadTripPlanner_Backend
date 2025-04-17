import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Trip} from "./entities/trip.entity";
import {TripsRepository} from "./repository/trips.repository";
import {StintsModule} from "../stints/stints.module";

@Module({
  imports: [
      TypeOrmModule.forFeature([Trip]),
      StintsModule
  ],
  controllers: [TripsController],
  providers: [TripsService, TripsRepository],
  exports: [TripsService, TripsRepository]
})
export class TripsModule {}
