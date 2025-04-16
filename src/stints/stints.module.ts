import { Module } from '@nestjs/common';
import { StintsController } from './stints.controller';
import { StintsService } from './stints.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Stint} from "./entities/stint.entity";
import {StintsRepository} from "./repository/stints.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Stint])],
  controllers: [StintsController],
  providers: [StintsService, StintsRepository],
  exports: [StintsService, StintsRepository]
})
export class StintsModule {}
