import { Module } from '@nestjs/common';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Supply} from "./entities/supply.entity";
import {SuppliesRepository} from "./repository/supplies.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Supply])],
  controllers: [SuppliesController],
  providers: [SuppliesService, SuppliesRepository],
  exports: [SuppliesService, SuppliesRepository]
})
export class SuppliesModule {}
